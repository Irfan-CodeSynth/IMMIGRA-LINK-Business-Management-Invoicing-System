import { Request, Response } from "express";
import crypto from "crypto";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { InvoiceModel } from "../models/Invoice";
import { CustomerModel } from "../models/Customer";
import { CompanySettingsModel } from "../models/CompanySettings";
import { getNextSequence } from "../models/Sequence";
import { FinancialService } from "../services/financialService";
import { generateBarcodeSvg, generateQrCodeDataUrl } from "../utils/barcode";
import { aedToFils, numberToAedWords, InvoiceStatus } from "@immigra/shared";
import { InvoiceCreateSchema } from "@immigra/shared";
import { AuditLogModel } from "../models/AuditLog";

export async function listInvoices(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { status, customerId, search, fromDate, toDate, page = 1, limit = 50 } = req.query;
    const query: any = {};

    if (status) {
      query.status = status;
    }
    if (customerId) {
      query.customerId = customerId;
    }
    if (fromDate || toDate) {
      query.issueDate = {};
      if (fromDate) query.issueDate.$gte = new Date(String(fromDate));
      if (toDate) query.issueDate.$lte = new Date(String(toDate));
    }
    if (search) {
      const regex = new RegExp(String(search), "i");
      query.$or = [
        { invoiceNumber: regex },
        { "customerSnapshot.displayName": regex },
        { "customerSnapshot.companyName": regex },
        { referenceNote: regex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      InvoiceModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      InvoiceModel.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        invoices,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getInvoice(req: Request, res: Response): Promise<void> {
  try {
    const rawParam = req.params.id ? `${req.params.id}${req.params[0] || ""}` : "";
    const id = (rawParam || (req.query.invoiceNumber as string) || "").toString().trim();
    let invoice = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      invoice = await InvoiceModel.findById(id);
    }
    if (!invoice) {
      invoice = await InvoiceModel.findOne({
        $or: [{ invoiceNumber: id }, { qrVerificationHash: id }],
      });
    }

    if (!invoice) {
      res.status(404).json({ success: false, message: "Invoice not found" });
      return;
    }
    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = InvoiceCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }

    const { customerId, issueDate, dueDate, supplyDate, referenceNote, items, notes, paymentTerms, status } = parsed.data;

    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found" });
      return;
    }

    // Get company settings for prefix
    const settings: any = (await CompanySettingsModel.findOne()) || {
      invoicePrefix: "INV/MAIN/",
      invoiceDefaultNotes: "Thank you for choosing Immigra Link Business Services.",
      invoicePaymentInstructions: "Please transfer payment via Bank or Cash.",
    };
    const prefix = settings.invoicePrefix || "INV/MAIN/";

    // Generate atomic sequence number
    const sequenceNumber = await getNextSequence("INVOICE_SEQUENCE", 1001);
    const invoiceNumber = `${prefix}${sequenceNumber}`;

    // Calculate line items in exact fils
    let subtotalFils = 0;
    let totalDiscountFils = 0;

    const calculatedItems = items.map((item) => {
      const unitRateFils = aedToFils(item.unitRateAed);
      const discountFils = aedToFils(item.discountAed || 0);
      const lineTotalFils = Math.max(0, item.quantity * unitRateFils - discountFils);

      subtotalFils += item.quantity * unitRateFils;
      totalDiscountFils += discountFils;

      return {
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        description: item.description || "",
        quantity: item.quantity,
        unitRateFils,
        discountFils,
        lineTotalFils,
      };
    });

    const grandTotalFils = Math.max(0, subtotalFils - totalDiscountFils);
    const amountInWords = numberToAedWords(grandTotalFils, true);

    // Generate unique verification token
    const qrVerificationHash = crypto.randomBytes(16).toString("hex");

    // Barcode SVG & QR Code
    const barcodeData = invoiceNumber;
    const origin = req.get("origin") || req.protocol + "://" + req.get("host");
    const qrUrl = `${origin}/verify-invoice/${qrVerificationHash}`;

    // Customer Snapshot
    const customerSnapshot = {
      displayName: customer.displayName,
      companyName: customer.companyName,
      phone: customer.phone,
      email: customer.email,
      address: [customer.address?.street, customer.address?.city, customer.address?.emirate]
        .filter(Boolean)
        .join(", "),
      trn: customer.trn,
    };

    const invoice = await InvoiceModel.create({
      invoiceNumber,
      sequenceNumber,
      customerId: customer._id,
      customerSnapshot,
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      supplyDate: supplyDate ? new Date(supplyDate) : undefined,
      referenceNote,
      status: status as InvoiceStatus,
      subtotalFils,
      discountFils: totalDiscountFils,
      taxFils: 0,
      grandTotalFils,
      paidAmountFils: 0,
      dueAmountFils: grandTotalFils,
      items: calculatedItems,
      amountInWords,
      barcodeData,
      qrVerificationHash,
      notes: notes || settings.invoiceDefaultNotes,
      paymentTerms: paymentTerms || settings.invoicePaymentInstructions,
      createdById: req.user?.userId,
      creatorName: req.user?.name || "Admin",
    });

    // If issued directly, post to double-entry general ledger
    if (status === InvoiceStatus.ISSUED && req.user) {
      const journalEntryId = await FinancialService.postInvoiceJournal(invoice, req.user.userId);
      invoice.journalEntryId = journalEntryId as any;
      await invoice.save();
    }

    if (req.user) {
      await AuditLogModel.create({
        userId: req.user.userId,
        userName: req.user.name,
        action: "CREATE_INVOICE",
        entityType: "INVOICE",
        entityId: invoice._id.toString(),
        details: { invoiceNumber, customer: customer.displayName, amountFils: grandTotalFils },
      });
    }

    res.status(201).json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function issueDraftInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const invoice = await InvoiceModel.findById(req.params.id);
    if (!invoice) {
      res.status(404).json({ success: false, message: "Invoice not found" });
      return;
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      res.status(400).json({ success: false, message: `Cannot issue invoice with status '${invoice.status}'` });
      return;
    }

    invoice.status = InvoiceStatus.ISSUED;
    if (req.user) {
      const journalEntryId = await FinancialService.postInvoiceJournal(invoice, req.user.userId);
      invoice.journalEntryId = journalEntryId as any;
    }
    await invoice.save();

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function voidInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const invoice = await InvoiceModel.findById(req.params.id);
    if (!invoice) {
      res.status(404).json({ success: false, message: "Invoice not found" });
      return;
    }

    if (invoice.status === InvoiceStatus.VOID) {
      res.status(400).json({ success: false, message: "Invoice is already void" });
      return;
    }

    if (invoice.paidAmountFils > 0) {
      res.status(400).json({
        success: false,
        message: "Cannot void an invoice with recorded payments. Please refund or reallocate payments first.",
      });
      return;
    }

    const previousStatus = invoice.status;
    invoice.status = InvoiceStatus.VOID;
    await invoice.save();

    // If it was issued, reverse customer balance & accounting entry
    if (previousStatus !== InvoiceStatus.DRAFT) {
      await CustomerModel.findByIdAndUpdate(invoice.customerId, {
        $inc: { balanceFils: -invoice.grandTotalFils },
      });
    }

    if (req.user) {
      await AuditLogModel.create({
        userId: req.user.userId,
        userName: req.user.name,
        action: "VOID_INVOICE",
        entityType: "INVOICE",
        entityId: invoice._id.toString(),
        details: { invoiceNumber: invoice.invoiceNumber },
      });
    }

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function verifyInvoiceByHash(req: Request, res: Response): Promise<void> {
  try {
    const rawParam = req.params.hash ? `${req.params.hash}${req.params[0] || ""}` : "";
    const hash = (rawParam || req.query.hash || "").toString().trim();

    if (!hash) {
      res.status(400).json({ success: false, message: "Verification identifier required" });
      return;
    }

    const invoice = await InvoiceModel.findOne({
      $or: [{ qrVerificationHash: hash }, { invoiceNumber: hash }],
    });

    if (!invoice) {
      res.status(404).json({
        success: false,
        verified: false,
        message: "Official record not found. The invoice could not be verified.",
      });
      return;
    }

    const settings = await CompanySettingsModel.findOne();

    // Return official verified record without internal sensitive accounting details
    res.json({
      success: true,
      verified: true,
      data: {
        issuer: settings?.companyName || "IMMIGRA LINK BUSINESS SERVICES",
        country: settings?.country || "United Arab Emirates",
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerSnapshot.displayName,
        companyName: invoice.customerSnapshot.companyName,
        issueDate: invoice.issueDate,
        status: invoice.status,
        grandTotalFils: invoice.grandTotalFils,
        paidAmountFils: invoice.paidAmountFils,
        dueAmountFils: invoice.dueAmountFils,
        itemsCount: invoice.items.length,
        verifiedAt: new Date(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
