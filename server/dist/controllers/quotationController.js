"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listQuotations = listQuotations;
exports.getQuotation = getQuotation;
exports.createQuotation = createQuotation;
exports.convertQuotationToInvoice = convertQuotationToInvoice;
const crypto_1 = __importDefault(require("crypto"));
const Quotation_1 = require("../models/Quotation");
const Invoice_1 = require("../models/Invoice");
const Customer_1 = require("../models/Customer");
const CompanySettings_1 = require("../models/CompanySettings");
const Sequence_1 = require("../models/Sequence");
const financialService_1 = require("../services/financialService");
const shared_1 = require("@immigra/shared");
const shared_2 = require("@immigra/shared");
const AuditLog_1 = require("../models/AuditLog");
async function listQuotations(req, res) {
    try {
        const { status, customerId, page = 1, limit = 50 } = req.query;
        const query = {};
        if (status)
            query.status = status;
        if (customerId)
            query.customerId = customerId;
        const skip = (Number(page) - 1) * Number(limit);
        const [quotations, total] = await Promise.all([
            Quotation_1.QuotationModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Quotation_1.QuotationModel.countDocuments(query),
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function getQuotation(req, res) {
    try {
        const quotation = await Quotation_1.QuotationModel.findById(req.params.id);
        if (!quotation) {
            res.status(404).json({ success: false, message: "Quotation not found" });
            return;
        }
        res.json({ success: true, data: quotation });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function createQuotation(req, res) {
    try {
        const parsed = shared_2.QuotationCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, errors: parsed.error.flatten() });
            return;
        }
        const { customerId, issueDate, expiryDate, items, notes, termsAndConditions } = parsed.data;
        const customer = await Customer_1.CustomerModel.findById(customerId);
        if (!customer) {
            res.status(404).json({ success: false, message: "Customer not found" });
            return;
        }
        const seq = await (0, Sequence_1.getNextSequence)("QUOTATION_SEQUENCE", 1);
        const quotationNumber = `QT-${(0, Sequence_1.formatSequence)(seq)}`;
        let subtotalFils = 0;
        let totalDiscountFils = 0;
        const calculatedItems = items.map((item) => {
            const unitRateFils = (0, shared_1.aedToFils)(item.unitRateAed);
            const discountFils = (0, shared_1.aedToFils)(item.discountAed || 0);
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
        const amountInWords = (0, shared_1.numberToAedWords)(grandTotalFils, true);
        const quotation = await Quotation_1.QuotationModel.create({
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
            status: shared_1.QuotationStatus.DRAFT,
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function convertQuotationToInvoice(req, res) {
    try {
        const quotation = await Quotation_1.QuotationModel.findById(req.params.id);
        if (!quotation) {
            res.status(404).json({ success: false, message: "Quotation not found" });
            return;
        }
        if (quotation.status === shared_1.QuotationStatus.CONVERTED) {
            res.status(400).json({ success: false, message: "Quotation is already converted to an invoice" });
            return;
        }
        const settings = (await CompanySettings_1.CompanySettingsModel.findOne()) || {
            invoicePrefix: "INV-",
            invoiceDefaultNotes: "Thank you for choosing Immigra Link Business Services.",
            invoicePaymentInstructions: "Please transfer payment via Bank or Cash.",
        };
        const prefix = settings.invoicePrefix || "INV-";
        const sequenceNumber = await (0, Sequence_1.getNextSequence)("INVOICE_SEQUENCE", 1);
        const invoiceNumber = `${prefix}${(0, Sequence_1.formatSequence)(sequenceNumber)}`;
        const qrVerificationHash = crypto_1.default.randomBytes(16).toString("hex");
        const invoice = await Invoice_1.InvoiceModel.create({
            invoiceNumber,
            sequenceNumber,
            customerId: quotation.customerId,
            customerSnapshot: quotation.customerSnapshot,
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
            referenceNote: `Converted from Quotation ${quotation.quotationNumber}`,
            status: shared_1.InvoiceStatus.ISSUED,
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
            const journalEntryId = await financialService_1.FinancialService.postInvoiceJournal(invoice, req.user.userId);
            invoice.journalEntryId = journalEntryId;
            await invoice.save();
        }
        quotation.status = shared_1.QuotationStatus.CONVERTED;
        quotation.convertedInvoiceId = invoice._id;
        await quotation.save();
        if (req.user) {
            await AuditLog_1.AuditLogModel.create({
                userId: req.user.userId,
                userName: req.user.name,
                action: "CONVERT_QUOTATION",
                entityType: "QUOTATION",
                entityId: quotation._id.toString(),
                details: { quotationNumber: quotation.quotationNumber, invoiceNumber },
            });
        }
        res.json({ success: true, data: { quotation, invoice } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
