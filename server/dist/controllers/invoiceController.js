"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listInvoices = listInvoices;
exports.getNextInvoiceNumber = getNextInvoiceNumber;
exports.getInvoice = getInvoice;
exports.createInvoice = createInvoice;
exports.issueDraftInvoice = issueDraftInvoice;
exports.voidInvoice = voidInvoice;
exports.verifyInvoiceByHash = verifyInvoiceByHash;
exports.updateInvoice = updateInvoice;
exports.deleteInvoice = deleteInvoice;
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
async function getNextInvoiceNumber(req, res) {
    try {
        const settings = (await CompanySettings_1.CompanySettingsModel.findOne()) || {
            invoicePrefix: "INV-",
        };
        const prefix = settings.invoicePrefix || "INV-";
        const sequenceNumber = await (0, Sequence_1.peekNextSequence)("INVOICE_SEQUENCE", 1);
        const formattedSeq = (0, Sequence_1.formatSequence)(sequenceNumber);
        const nextInvoiceNumber = `${prefix}${formattedSeq}`;
        res.json({
            success: true,
            data: {
                nextInvoiceNumber,
                sequenceNumber,
                prefix,
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
            invoicePrefix: "INV-",
            invoiceDefaultNotes: "Thank you for choosing Immigra Link Business Services.",
            invoicePaymentInstructions: "Please transfer payment via Bank or Cash.",
        };
        const prefix = settings.invoicePrefix || "INV-";
        // Generate atomic sequence number starting from 1 (e.g. 001, 002, 003...)
        const sequenceNumber = await (0, Sequence_1.getNextSequence)("INVOICE_SEQUENCE", 1);
        const formattedSeq = (0, Sequence_1.formatSequence)(sequenceNumber);
        const invoiceNumber = `${prefix}${formattedSeq}`;
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
                companyName: item.companyName || "",
                clientName: item.clientName || "",
                category: item.category || "",
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
async function updateInvoice(req, res) {
    try {
        const invoice = await Invoice_1.InvoiceModel.findById(req.params.id);
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
            const newCustomer = await Customer_1.CustomerModel.findById(customerId);
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
            const calculatedItems = items.map((item) => {
                const unitRateFils = (0, shared_1.aedToFils)(item.unitRateAed || 0);
                const discountFils = (0, shared_1.aedToFils)(item.discountAed || 0);
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
            invoice.items = calculatedItems;
            invoice.subtotalFils = subtotalFils;
            invoice.discountFils = totalDiscountFils;
            invoice.grandTotalFils = grandTotalFils;
            invoice.dueAmountFils = Math.max(0, grandTotalFils - invoice.paidAmountFils);
            invoice.amountInWords = (0, shared_1.numberToAedWords)(grandTotalFils, true);
            // Re-evaluate status based on due amount if invoice is not draft or void
            if (invoice.status !== shared_1.InvoiceStatus.VOID && invoice.status !== shared_1.InvoiceStatus.DRAFT) {
                if (invoice.dueAmountFils === 0 && invoice.grandTotalFils > 0) {
                    invoice.status = shared_1.InvoiceStatus.PAID;
                }
                else if (invoice.paidAmountFils > 0) {
                    invoice.status = shared_1.InvoiceStatus.PARTIALLY_PAID;
                }
                else {
                    invoice.status = shared_1.InvoiceStatus.ISSUED;
                }
            }
        }
        if (issueDate)
            invoice.issueDate = new Date(issueDate);
        if (dueDate)
            invoice.dueDate = new Date(dueDate);
        if (supplyDate !== undefined)
            invoice.supplyDate = supplyDate ? new Date(supplyDate) : undefined;
        if (referenceNote !== undefined)
            invoice.referenceNote = referenceNote;
        if (notes !== undefined)
            invoice.notes = notes;
        if (paymentTerms !== undefined)
            invoice.paymentTerms = paymentTerms;
        // Status transition: If changing DRAFT -> ISSUED
        if (status && status === shared_1.InvoiceStatus.ISSUED && oldStatus === shared_1.InvoiceStatus.DRAFT) {
            invoice.status = shared_1.InvoiceStatus.ISSUED;
            if (req.user) {
                const journalEntryId = await financialService_1.FinancialService.postInvoiceJournal(invoice, req.user.userId);
                invoice.journalEntryId = journalEntryId;
            }
        }
        else if (oldStatus !== shared_1.InvoiceStatus.DRAFT && oldStatus !== shared_1.InvoiceStatus.VOID) {
            // Adjust balances if total changed or customer changed
            const deltaFils = invoice.grandTotalFils - oldGrandTotalFils;
            const newCustomerId = invoice.customerId.toString();
            if (oldCustomerId && newCustomerId !== oldCustomerId) {
                await Customer_1.CustomerModel.findByIdAndUpdate(oldCustomerId, {
                    $inc: { balanceFils: -oldGrandTotalFils },
                });
                await Customer_1.CustomerModel.findByIdAndUpdate(newCustomerId, {
                    $inc: { balanceFils: invoice.grandTotalFils },
                });
            }
            else if (deltaFils !== 0) {
                await Customer_1.CustomerModel.findByIdAndUpdate(invoice.customerId, {
                    $inc: { balanceFils: deltaFils },
                });
            }
            if (deltaFils !== 0 && req.user) {
                await financialService_1.FinancialService.adjustInvoiceJournal(invoice, deltaFils, req.user.userId);
            }
        }
        await invoice.save();
        if (req.user) {
            await AuditLog_1.AuditLogModel.create({
                userId: req.user.userId,
                userName: req.user.name,
                action: "UPDATE_INVOICE",
                entityType: "INVOICE",
                entityId: invoice._id.toString(),
                details: { invoiceNumber: invoice.invoiceNumber, grandTotalFils: invoice.grandTotalFils },
            });
        }
        res.json({ success: true, data: invoice });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function deleteInvoice(req, res) {
    try {
        const invoice = await Invoice_1.InvoiceModel.findById(req.params.id);
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
        if (invoice.status === shared_1.InvoiceStatus.ISSUED) {
            // Revert customer balance
            await Customer_1.CustomerModel.findByIdAndUpdate(invoice.customerId, {
                $inc: { balanceFils: -invoice.grandTotalFils },
            });
        }
        await Invoice_1.InvoiceModel.findByIdAndDelete(invoice._id);
        if (req.user) {
            await AuditLog_1.AuditLogModel.create({
                userId: req.user.userId,
                userName: req.user.name,
                action: "DELETE_INVOICE",
                entityType: "INVOICE",
                entityId: invoice._id.toString(),
                details: { invoiceNumber: invoice.invoiceNumber },
            });
        }
        res.json({ success: true, message: `Invoice "${invoice.invoiceNumber}" deleted successfully`, data: invoice });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
