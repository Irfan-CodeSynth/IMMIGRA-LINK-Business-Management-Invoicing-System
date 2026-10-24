import { Request, Response } from "express";
import crypto from "crypto";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { InvoiceModel } from "../models/Invoice";
import { CustomerModel } from "../models/Customer";
import { CompanySettingsModel } from "../models/CompanySettings";
import { getNextSequence, peekNextSequence, formatSequence } from "../models/Sequence";
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

export async function getNextInvoiceNumber(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const settings: any = (await CompanySettingsModel.findOne()) || {
      invoicePrefix: "INV-",
    };
    const prefix = settings.invoicePrefix || "INV-";
    const sequenceNumber = await peekNextSequence("INVOICE_SEQUENCE", 1);
    const formattedSeq = formatSequence(sequenceNumber);
    const nextInvoiceNumber = `${prefix}${formattedSeq}`;

    res.json({
      success: true,
      data: {
        nextInvoiceNumber,
        sequenceNumber,
        prefix,
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
      invoicePrefix: "INV-",
      invoiceDefaultNotes: "Thank you for choosing Immigra Link Business Services.",
      invoicePaymentInstructions: "Please transfer payment via Bank or Cash.",
    };
    const prefix = settings.invoicePrefix || "INV-";

    // Generate atomic sequence number starting from 1 (e.g. 001, 002, 003...)
    const sequenceNumber = await getNextSequence("INVOICE_SEQUENCE", 1);
    const formattedSeq = formatSequence(sequenceNumber);
    const invoiceNumber = `${prefix}${formattedSeq}`;

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
        companyName: (item as any).companyName || "",
        clientName: item.clientName || "",
        category: (item as any).category || "",
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
      companyName: customer.companyName || (customer.customerType === "BUSINESS" ? customer.displayName : undefined),
      contactPerson: customer.contactPerson || customer.displayName,
      clientName: customer.contactPerson || customer.displayName,
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

export async function updateInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const invoice = await InvoiceModel.findById(req.params.id);
    if (!invoice) {
      res.status(404).json({ success: false, message: "Invoice not found" });
      return;
    }

    const { customerId, issueDate, dueDate, supplyDate, referenceNote, items, notes, paymentTerms, status } = req.body;

    const oldCustomerId = invoice.customerId ? invoice.customerId.toString() : null;
    const oldGrandTotalFils = invoice.grandTotalFils || 0;
    const oldStatus = invoice.status;

    // 1. Update customer snapshot if customer changed
    if (customerId && customerId !== oldCustomerId) {
      const newCustomer = await CustomerModel.findById(customerId);
      if (!newCustomer) {
        res.status(404).json({ success: false, message: "Selected customer not found" });
        return;
      }
      invoice.customerId = newCustomer._id;
      invoice.customerSnapshot = {
        displayName: newCustomer.displayName,
        companyName: newCustomer.companyName || (newCustomer.customerType === "BUSINESS" ? newCustomer.displayName : undefined),
        contactPerson: newCustomer.contactPerson || newCustomer.displayName,
        clientName: newCustomer.contactPerson || newCustomer.displayName,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: [newCustomer.address?.street, newCustomer.address?.city, newCustomer.address?.emirate]
          .filter(Boolean)
          .join(", "),
        trn: newCustomer.trn,
      };
    }

    // 2. Update line items if provided
    if (items && Array.isArray(items)) {
      let subtotalFils = 0;
      let totalDiscountFils = 0;
      const calculatedItems = items.map((item: any) => {
        const unitRateFils = aedToFils(item.unitRateAed || 0);
        const discountFils = aedToFils(item.discountAed || 0);
        const lineTotalFils = Math.max(0, (item.quantity || 1) * unitRateFils - discountFils);
        subtotalFils += (item.quantity || 1) * unitRateFils;
        totalDiscountFils += discountFils;
        return {
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          companyName: item.companyName || "",
          clientName: item.clientName || "",
          category: item.category || "",
          description: item.description || "",
          quantity: item.quantity || 1,
          unitRateFils,
          discountFils,
          lineTotalFils,
        };
      });
      const grandTotalFils = Math.max(0, subtotalFils - totalDiscountFils);

      // Check if grandTotalFils is less than already recorded payments
      if (invoice.paidAmountFils > 0 && grandTotalFils < invoice.paidAmountFils) {
        res.status(400).json({
          success: false,
          message: `Cannot reduce invoice total (AED ${(grandTotalFils / 100).toFixed(2)}) below already recorded payments of AED ${(invoice.paidAmountFils / 100).toFixed(2)}.`,
        });
        return;
      }

      invoice.items = calculatedItems as any;
      invoice.subtotalFils = subtotalFils;
      invoice.discountFils = totalDiscountFils;
      invoice.grandTotalFils = grandTotalFils;
      invoice.dueAmountFils = Math.max(0, grandTotalFils - invoice.paidAmountFils);
      invoice.amountInWords = numberToAedWords(grandTotalFils, true);

      // Re-evaluate status based on due amount if invoice is not draft or void
      if (invoice.status !== InvoiceStatus.VOID && invoice.status !== InvoiceStatus.DRAFT) {
        if (invoice.dueAmountFils === 0 && invoice.grandTotalFils > 0) {
          invoice.status = InvoiceStatus.PAID;
        } else if (invoice.paidAmountFils > 0) {
          invoice.status = InvoiceStatus.PARTIALLY_PAID;
        } else {
          invoice.status = InvoiceStatus.ISSUED;
        }
      }
    }

    if (issueDate) invoice.issueDate = new Date(issueDate);
    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (supplyDate !== undefined) invoice.supplyDate = supplyDate ? new Date(supplyDate) : undefined;
    if (referenceNote !== undefined) invoice.referenceNote = referenceNote;
    if (notes !== undefined) invoice.notes = notes;
    if (paymentTerms !== undefined) invoice.paymentTerms = paymentTerms;

    // Status transition: If changing DRAFT -> ISSUED
    if (status && status === InvoiceStatus.ISSUED && oldStatus === InvoiceStatus.DRAFT) {
      invoice.status = InvoiceStatus.ISSUED;
      if (req.user) {
        const journalEntryId = await FinancialService.postInvoiceJournal(invoice, req.user.userId);
        invoice.journalEntryId = journalEntryId as any;
      }
    } else if (oldStatus !== InvoiceStatus.DRAFT && oldStatus !== InvoiceStatus.VOID) {
      // Adjust balances if total changed or customer changed
      const deltaFils = invoice.grandTotalFils - oldGrandTotalFils;
      const newCustomerId = invoice.customerId.toString();

      if (oldCustomerId && newCustomerId !== oldCustomerId) {
        await CustomerModel.findByIdAndUpdate(oldCustomerId, {
          $inc: { balanceFils: -oldGrandTotalFils },
        });
        await CustomerModel.findByIdAndUpdate(newCustomerId, {
          $inc: { balanceFils: invoice.grandTotalFils },
        });
      } else if (deltaFils !== 0) {
        await CustomerModel.findByIdAndUpdate(invoice.customerId, {
          $inc: { balanceFils: deltaFils },
        });
      }

      if (deltaFils !== 0 && req.user) {
        await FinancialService.adjustInvoiceJournal(invoice, deltaFils, req.user.userId);
      }
    }

    await invoice.save();

    if (req.user) {
      await AuditLogModel.create({
        userId: req.user.userId,
        userName: req.user.name,
        action: "UPDATE_INVOICE",
        entityType: "INVOICE",
        entityId: invoice._id.toString(),
        details: { invoiceNumber: invoice.invoiceNumber, grandTotalFils: invoice.grandTotalFils },
      });
    }

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const invoice = await InvoiceModel.findById(req.params.id);
    if (!invoice) {
      res.status(404).json({ success: false, message: "Invoice not found" });
      return;
    }

    if (invoice.paidAmountFils > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete invoice ${invoice.invoiceNumber} because AED ${(invoice.paidAmountFils / 100).toFixed(2)} in payments have been recorded. Void the payments first.`,
      });
      return;
    }

    if (invoice.status === InvoiceStatus.ISSUED) {
      // Revert customer balance
      await CustomerModel.findByIdAndUpdate(invoice.customerId, {
        $inc: { balanceFils: -invoice.grandTotalFils },
      });
    }

    await InvoiceModel.findByIdAndDelete(invoice._id);

    if (req.user) {
      await AuditLogModel.create({
        userId: req.user.userId,
        userName: req.user.name,
        action: "DELETE_INVOICE",
        entityType: "INVOICE",
        entityId: invoice._id.toString(),
        details: { invoiceNumber: invoice.invoiceNumber },
      });
    }

    res.json({ success: true, message: `Invoice "${invoice.invoiceNumber}" deleted successfully`, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
