"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCustomers = listCustomers;
exports.getCustomer = getCustomer;
exports.createCustomer = createCustomer;
exports.updateCustomer = updateCustomer;
exports.toggleCustomerStatus = toggleCustomerStatus;
exports.deleteCustomer = deleteCustomer;
const Customer_1 = require("../models/Customer");
const Invoice_1 = require("../models/Invoice");
const Payment_1 = require("../models/Payment");
const Sequence_1 = require("../models/Sequence");
const shared_1 = require("@immigra/shared");
const AuditLog_1 = require("../models/AuditLog");
async function listCustomers(req, res) {
    try {
        const { search, type, status, page = 1, limit = 50 } = req.query;
        const query = {};
        if (type) {
            query.customerType = type;
        }
        if (status === "active") {
            query.isActive = true;
        }
        else if (status === "inactive") {
            query.isActive = false;
        }
        if (search) {
            const regex = new RegExp(String(search), "i");
            query.$or = [
                { displayName: regex },
                { companyName: regex },
                { phone: regex },
                { email: regex },
                { referenceNumber: regex },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [customers, total] = await Promise.all([
            Customer_1.CustomerModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Customer_1.CustomerModel.countDocuments(query),
        ]);
        res.json({
            success: true,
            data: {
                customers,
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
async function getCustomer(req, res) {
    try {
        const customer = await Customer_1.CustomerModel.findById(req.params.id);
        if (!customer) {
            res.status(404).json({ success: false, message: "Customer not found" });
            return;
        }
        // Fetch related invoices and payments
        const [invoices, payments] = await Promise.all([
            Invoice_1.InvoiceModel.find({ customerId: customer._id }).sort({ issueDate: -1 }),
            Payment_1.PaymentModel.find({ customerId: customer._id }).sort({ paymentDate: -1 }),
        ]);
        res.json({
            success: true,
            data: {
                customer,
                invoices,
                payments,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function createCustomer(req, res) {
    try {
        const parsed = shared_1.CustomerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, errors: parsed.error.flatten() });
            return;
        }
        const seq = await (0, Sequence_1.getNextSequence)("CUSTOMER", 1001);
        const referenceNumber = `CUST-${seq}`;
        const customer = await Customer_1.CustomerModel.create({
            ...parsed.data,
            referenceNumber,
        });
        if (req.user) {
            await AuditLog_1.AuditLogModel.create({
                userId: req.user.userId,
                userName: req.user.name,
                action: "CREATE_CUSTOMER",
                entityType: "CUSTOMER",
                entityId: customer._id.toString(),
                details: { referenceNumber, displayName: customer.displayName },
            });
        }
        res.status(201).json({ success: true, data: customer });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function updateCustomer(req, res) {
    try {
        const parsed = shared_1.CustomerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, errors: parsed.error.flatten() });
            return;
        }
        const customer = await Customer_1.CustomerModel.findByIdAndUpdate(req.params.id, { $set: parsed.data }, { new: true });
        if (!customer) {
            res.status(404).json({ success: false, message: "Customer not found" });
            return;
        }
        if (req.user) {
            await AuditLog_1.AuditLogModel.create({
                userId: req.user.userId,
                userName: req.user.name,
                action: "UPDATE_CUSTOMER",
                entityType: "CUSTOMER",
                entityId: customer._id.toString(),
                details: { displayName: customer.displayName },
            });
        }
        res.json({ success: true, data: customer });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function toggleCustomerStatus(req, res) {
    try {
        const customer = await Customer_1.CustomerModel.findById(req.params.id);
        if (!customer) {
            res.status(404).json({ success: false, message: "Customer not found" });
            return;
        }
        customer.isActive = !customer.isActive;
        await customer.save();
        res.json({ success: true, data: customer });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function deleteCustomer(req, res) {
    try {
        const customer = await Customer_1.CustomerModel.findById(req.params.id);
        if (!customer) {
            res.status(404).json({ success: false, message: "Customer not found" });
            return;
        }
        const invoiceCount = await Invoice_1.InvoiceModel.countDocuments({ customerId: customer._id });
        if (invoiceCount > 0) {
            customer.isActive = false;
            await customer.save();
            res.json({
                success: true,
                message: `Customer "${customer.displayName}" has ${invoiceCount} linked invoice(s). Safely archived customer to preserve fiscal audit trail.`,
                data: customer,
            });
            return;
        }
        await Customer_1.CustomerModel.findByIdAndDelete(customer._id);
        if (req.user) {
            await AuditLog_1.AuditLogModel.create({
                userId: req.user.userId,
                userName: req.user.name,
                action: "DELETE_CUSTOMER",
                entityType: "CUSTOMER",
                entityId: customer._id.toString(),
                details: { displayName: customer.displayName, referenceNumber: customer.referenceNumber },
            });
        }
        res.json({ success: true, message: "Customer deleted successfully", data: customer });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
