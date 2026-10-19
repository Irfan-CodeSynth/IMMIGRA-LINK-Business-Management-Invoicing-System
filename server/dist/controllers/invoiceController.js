"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listInvoices = listInvoices;
exports.getInvoice = getInvoice;
exports.createInvoice = createInvoice;
exports.issueDraftInvoice = issueDraftInvoice;
exports.voidInvoice = voidInvoice;
exports.verifyInvoiceByHash = verifyInvoiceByHash;
const crypto_1 = __importDefault(require("crypto"));
const Invoice_1 = require("../models/Invoice");
const Customer_1 = require("../models/Customer");
const CompanySettings_1 = require("../models/CompanySettings");
const Sequence_1 = require("../models/Sequence");
const financialService_1 = require("../services/financialService");
const shared_1 = require("@immigra/shared");
const shared_2 = require("@immigra/shared");
const AuditLog_1 = require("../models/AuditLog");
async function listInvoices(req, res) {
    try {
        const { status, customerId, search, fromDate, toDate, page = 1, limit = 50 } = req.query;
        const query = {};
        if (status) {
            query.status = status;
        }
        if (customerId) {
            query.customerId = customerId;
        }
        if (fromDate || toDate) {
            query.issueDate = {};
            if (fromDate)
                query.issueDate.$gte = new Date(String(fromDate));
            if (toDate)
                query.issueDate.$lte = new Date(String(toDate));
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
            Invoice_1.InvoiceModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Invoice_1.InvoiceModel.countDocuments(query),
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function getInvoice(req, res) {
    try {
        const rawParam = req.params.id ? `${req.params.id}${req.params[0] || ""}` : "";
        const id = (rawParam || req.query.invoiceNumber || "").toString().trim();
        let invoice = null;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            invoice = await Invoice_1.InvoiceModel.findById(id);
        }
        if (!invoice) {
            invoice = await Invoice_1.InvoiceModel.findOne({
                $or: [{ invoiceNumber: id }, { qrVerificationHash: id }],
            });
        }
        if (!invoice) {
            res.status(404).json({ success: false, message: "Invoice not found" });
            return;
        }
        res.json({ success: true, data: invoice });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function createInvoice(req, res) {
    try {
        const parsed = shared_2.InvoiceCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, errors: parsed.error.flatten() });
            return;
        }
        const { customerId, issueDate, dueDate, supplyDate, referenceNote, items, notes, paymentTerms, status } = parsed.data;
        const customer = await Customer_1.CustomerModel.findById(customerId);
        if (!customer) {
            res.status(404).json({ success: false, message: "Customer not found" });
            return;
        }
        // Get company settings for prefix
        const settings = (await CompanySettings_1.CompanySettingsModel.findOne()) || {
            invoicePrefix: "INV/MAIN/",
            invoiceDefaultNotes: "Thank you for choosing Immigra Link Business Services.",
            invoicePaymentInstructions: "Please transfer payment via Bank or Cash.",
        };
        const prefix = settings.invoicePrefix || "INV/MAIN/";
        // Generate atomic sequence number
        const sequenceNumber = await (0, Sequence_1.getNextSequence)("INVOICE_SEQUENCE", 1001);
        const invoiceNumber = `${prefix}${sequenceNumber}`;
        // Calculate line items in exact fils
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
        // Generate unique verification token
        const qrVerificationHash = crypto_1.default.randomBytes(16).toString("hex");
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
        const invoice = await Invoice_1.InvoiceModel.create({
            invoiceNumber,
            sequenceNumber,
            customerId: customer._id,
            customerSnapshot,
            issueDate: new Date(issueDate),
            dueDate: new Date(dueDate),
            supplyDate: supplyDate ? new Date(supplyDate) : undefined,
            referenceNote,
            status: status,
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
        if (status === shared_1.InvoiceStatus.ISSUED && req.user) {
            const journalEntryId = await financialService_1.FinancialService.postInvoiceJournal(invoice, req.user.userId);
            invoice.journalEntryId = journalEntryId;
            await invoice.save();
        }
        if (req.user) {
            await AuditLog_1.AuditLogModel.create({
                userId: req.user.userId,
                userName: req.user.name,
                action: "CREATE_INVOICE",
                entityType: "INVOICE",
                entityId: invoice._id.toString(),
                details: { invoiceNumber, customer: customer.displayName, amountFils: grandTotalFils },
            });
        }
        res.status(201).json({ success: true, data: invoice });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function issueDraftInvoice(req, res) {
    try {
        const invoice = await Invoice_1.InvoiceModel.findById(req.params.id);
        if (!invoice) {
            res.status(404).json({ success: false, message: "Invoice not found" });
            return;
        }
        if (invoice.status !== shared_1.InvoiceStatus.DRAFT) {
            res.status(400).json({ success: false, message: `Cannot issue invoice with status '${invoice.status}'` });
            return;
        }
        invoice.status = shared_1.InvoiceStatus.ISSUED;
        if (req.user) {
            const journalEntryId = await financialService_1.FinancialService.postInvoiceJournal(invoice, req.user.userId);
            invoice.journalEntryId = journalEntryId;
        }
        await invoice.save();
        res.json({ success: true, data: invoice });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function voidInvoice(req, res) {
    try {
        const invoice = await Invoice_1.InvoiceModel.findById(req.params.id);
        if (!invoice) {
            res.status(404).json({ success: false, message: "Invoice not found" });
            return;
        }
        if (invoice.status === shared_1.InvoiceStatus.VOID) {
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
        invoice.status = shared_1.InvoiceStatus.VOID;
        await invoice.save();
        // If it was issued, reverse customer balance & accounting entry
        if (previousStatus !== shared_1.InvoiceStatus.DRAFT) {
            await Customer_1.CustomerModel.findByIdAndUpdate(invoice.customerId, {
                $inc: { balanceFils: -invoice.grandTotalFils },
            });
        }
        if (req.user) {
            await AuditLog_1.AuditLogModel.create({
                userId: req.user.userId,
                userName: req.user.name,
                action: "VOID_INVOICE",
                entityType: "INVOICE",
                entityId: invoice._id.toString(),
                details: { invoiceNumber: invoice.invoiceNumber },
            });
        }
        res.json({ success: true, data: invoice });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function verifyInvoiceByHash(req, res) {
    try {
        const rawParam = req.params.hash ? `${req.params.hash}${req.params[0] || ""}` : "";
        const hash = (rawParam || req.query.hash || "").toString().trim();
        if (!hash) {
            res.status(400).json({ success: false, message: "Verification identifier required" });
            return;
        }
        const invoice = await Invoice_1.InvoiceModel.findOne({
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
        const settings = await CompanySettings_1.CompanySettingsModel.findOne();
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
