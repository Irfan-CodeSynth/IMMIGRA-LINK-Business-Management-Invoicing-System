import { Response } from "express";
import crypto from "crypto";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { QuotationModel } from "../models/Quotation";
import { InvoiceModel } from "../models/Invoice";
import { CustomerModel } from "../models/Customer";
import { CompanySettingsModel } from "../models/CompanySettings";
import { getNextSequence } from "../models/Sequence";
import { FinancialService } from "../services/financialService";
import { aedToFils, numberToAedWords, QuotationStatus, InvoiceStatus } from "@immigra/shared";
import { QuotationCreateSchema } from "@immigra/shared";
import { AuditLogModel } from "../models/AuditLog";

export async function listQuotations(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { status, customerId, page = 1, limit = 50 } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;

    const skip = (Number(page) - 1) * Number(limit);
    const [quotations, total] = await Promise.all([
      QuotationModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      QuotationModel.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        quotations,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getQuotation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const quotation = await QuotationModel.findById(req.params.id);
    if (!quotation) {
      res.status(404).json({ success: false, message: "Quotation not found" });
      return;
    }
    res.json({ success: true, data: quotation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createQuotation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = QuotationCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }

    const { customerId, issueDate, expiryDate, items, notes, termsAndConditions } = parsed.data;
    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found" });
      return;
    }

    const seq = await getNextSequence("QUOTATION_SEQUENCE", 1001);
    const quotationNumber = `QT/MAIN/${seq}`;

    let subtotalFils = 0;
    let totalDiscountFils = 0;

    const calculatedItems = items.map((item) => {
      const unitRateFils = aedToFils(item.unitRateAed);
      const discountFils = aedToFils(item.discountAed || 0);
      const lineTotalFils = Math.max(0, item.quantity * unitRateFils - discountFils);

      subtotalFils += item.quantity * unitRateFils;
      totalDiscountFils += discountFils;

      return {
        serviceId: item.serviceId as any,
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

    const quotation = await QuotationModel.create({
      quotationNumber,
      customerId: customer._id,
      customerSnapshot: {
        displayName: customer.displayName,
        companyName: customer.companyName,
        phone: customer.phone,
        email: customer.email,
        address: [customer.address?.street, customer.address?.city, customer.address?.emirate].filter(Boolean).join(", "),
      },
      issueDate: new Date(issueDate),
      expiryDate: new Date(expiryDate),
      status: QuotationStatus.DRAFT,
      subtotalFils,
      discountFils: totalDiscountFils,
      grandTotalFils,
      items: calculatedItems,
      amountInWords,
      notes,
      termsAndConditions,
      createdById: req.user?.userId,
      creatorName: req.user?.name || "Admin",
    });

    res.status(201).json({ success: true, data: quotation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function convertQuotationToInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const quotation = await QuotationModel.findById(req.params.id);
    if (!quotation) {
      res.status(404).json({ success: false, message: "Quotation not found" });
      return;
    }

    if (quotation.status === QuotationStatus.CONVERTED) {
      res.status(400).json({ success: false, message: "Quotation is already converted to an invoice" });
      return;
    }

    const settings: any = (await CompanySettingsModel.findOne()) || {
      invoicePrefix: "INV/MAIN/",
      invoiceDefaultNotes: "Thank you for choosing Immigra Link Business Services.",
      invoicePaymentInstructions: "Please transfer payment via Bank or Cash.",
    };
    const prefix = settings.invoicePrefix || "INV/MAIN/";
    const sequenceNumber = await getNextSequence("INVOICE_SEQUENCE", 1001);
    const invoiceNumber = `${prefix}${sequenceNumber}`;
    const qrVerificationHash = crypto.randomBytes(16).toString("hex");

    const invoice = await InvoiceModel.create({
      invoiceNumber,
      sequenceNumber,
      customerId: quotation.customerId,
      customerSnapshot: quotation.customerSnapshot,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
      referenceNote: `Converted from Quotation ${quotation.quotationNumber}`,
      status: InvoiceStatus.ISSUED,
      subtotalFils: quotation.subtotalFils,
      discountFils: quotation.discountFils,
      taxFils: 0,
      grandTotalFils: quotation.grandTotalFils,
      paidAmountFils: 0,
      dueAmountFils: quotation.grandTotalFils,
      items: quotation.items,
      amountInWords: quotation.amountInWords,
      barcodeData: invoiceNumber,
      qrVerificationHash,
      notes: quotation.notes || settings.invoiceDefaultNotes,
      paymentTerms: settings.invoicePaymentInstructions,
      createdById: req.user?.userId,
      creatorName: req.user?.name || "Admin",
    });

    if (req.user) {
      const journalEntryId = await FinancialService.postInvoiceJournal(invoice, req.user.userId);
      invoice.journalEntryId = journalEntryId as any;
      await invoice.save();
    }

    quotation.status = QuotationStatus.CONVERTED;
    quotation.convertedInvoiceId = invoice._id as any;
    await quotation.save();

    if (req.user) {
      await AuditLogModel.create({
        userId: req.user.userId,
        userName: req.user.name,
        action: "CONVERT_QUOTATION",
        entityType: "QUOTATION",
        entityId: quotation._id.toString(),
        details: { quotationNumber: quotation.quotationNumber, invoiceNumber },
      });
    }

    res.json({ success: true, data: { quotation, invoice } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
