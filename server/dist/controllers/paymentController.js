"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPayments = listPayments;
exports.getPayment = getPayment;
exports.createPayment = createPayment;
const Payment_1 = require("../models/Payment");
const Customer_1 = require("../models/Customer");
const Invoice_1 = require("../models/Invoice");
const Sequence_1 = require("../models/Sequence");
const financialService_1 = require("../services/financialService");
const shared_1 = require("@immigra/shared");
const shared_2 = require("@immigra/shared");
const AuditLog_1 = require("../models/AuditLog");
async function listPayments(req, res) {
    try {
        const { customerId, page = 1, limit = 50 } = req.query;
        const query = {};
        if (customerId)
            query.customerId = customerId;
        const skip = (Number(page) - 1) * Number(limit);
        const [payments, total] = await Promise.all([
            Payment_1.PaymentModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Payment_1.PaymentModel.countDocuments(query),
        ]);
        res.json({
            success: true,
            data: {
                payments,
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
async function getPayment(req, res) {
    try {
        const payment = await Payment_1.PaymentModel.findById(req.params.id);
        if (!payment) {
            res.status(404).json({ success: false, message: "Payment receipt not found" });
            return;
        }
        res.json({ success: true, data: payment });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function createPayment(req, res) {
    try {
        const parsed = shared_2.PaymentCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, errors: parsed.error.flatten() });
            return;
        }
        const { customerId, paymentDate, amountAed, paymentMethod, depositAccountCode, referenceNumber, allocations, notes } = parsed.data;
        const customer = await Customer_1.CustomerModel.findById(customerId);
        if (!customer) {
            res.status(404).json({ success: false, message: "Customer not found" });
            return;
        }
        const seq = await (0, Sequence_1.getNextSequence)("PAYMENT_RECEIPT", 1001);
        const receiptNumber = `REC/2026/${seq}`;
        const amountFils = (0, shared_1.aedToFils)(amountAed);
        let allocatedTotalFils = 0;
        const formattedAllocations = await Promise.all((allocations || []).map(async (a) => {
            const allocFils = (0, shared_1.aedToFils)(a.allocatedAmountAed);
            allocatedTotalFils += allocFils;
            const inv = await Invoice_1.InvoiceModel.findById(a.invoiceId);
            return {
                invoiceId: a.invoiceId,
                invoiceNumber: inv ? inv.invoiceNumber : "",
                allocatedAmountFils: allocFils,
            };
        }));
        if (allocatedTotalFils > amountFils) {
            res.status(400).json({
                success: false,
                message: "Total allocated amount exceeds the received payment amount",
            });
            return;
        }
        const unallocatedBalanceFils = amountFils - allocatedTotalFils;
        const payment = await Payment_1.PaymentModel.create({
            receiptNumber,
            customerId: customer._id,
            customerName: customer.displayName,
            paymentDate: new Date(paymentDate),
            amountFils,
            paymentMethod,
            depositAccountCode,
            referenceNumber,
            allocations: formattedAllocations,
            unallocatedBalanceFils,
            notes,
            createdById: req.user?.userId,
        });
        // Post to double-entry general ledger
        if (req.user) {
            const journalEntryId = await financialService_1.FinancialService.postPaymentJournal(payment, req.user.userId);
            payment.journalEntryId = journalEntryId;
            await payment.save();
        }
        if (req.user) {
            await AuditLog_1.AuditLogModel.create({
                userId: req.user.userId,
                userName: req.user.name,
                action: "RECORD_PAYMENT",
                entityType: "PAYMENT",
                entityId: payment._id.toString(),
                details: { receiptNumber, customer: customer.displayName, amountFils },
            });
        }
        res.status(201).json({ success: true, data: payment });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
