"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardOverview = getDashboardOverview;
const Invoice_1 = require("../models/Invoice");
const Payment_1 = require("../models/Payment");
const Expense_1 = require("../models/Expense");
const Customer_1 = require("../models/Customer");
const Account_1 = require("../models/Account");
const shared_1 = require("@immigra/shared");
async function getDashboardOverview(req, res) {
    try {
        const now = new Date();
        const [invoicedAgg, paymentsAgg, expensesAgg, overdueAgg, customerCount, totalInvoicesCount, unpaidInvoicesCount, cashAccounts, recentInvoices, recentPayments, monthlyRevenueAgg, monthlyExpenseAgg,] = await Promise.all([
            // Total Invoiced (issued / paid / partially paid)
            Invoice_1.InvoiceModel.aggregate([
                { $match: { status: { $in: [shared_1.InvoiceStatus.ISSUED, shared_1.InvoiceStatus.PARTIALLY_PAID, shared_1.InvoiceStatus.PAID, shared_1.InvoiceStatus.OVERDUE] } } },
                { $group: { _id: null, total: { $sum: "$grandTotalFils" }, outstanding: { $sum: "$dueAmountFils" } } },
            ]),
            // Total Collected
            Payment_1.PaymentModel.aggregate([
                { $group: { _id: null, total: { $sum: "$amountFils" } } },
            ]),
            // Total Expenses
            Expense_1.ExpenseModel.aggregate([
                { $match: { status: "POSTED" } },
                { $group: { _id: null, total: { $sum: "$amountFils" } } },
            ]),
            // Overdue
            Invoice_1.InvoiceModel.aggregate([
                { $match: { status: { $in: [shared_1.InvoiceStatus.ISSUED, shared_1.InvoiceStatus.PARTIALLY_PAID] }, dueDate: { $lt: now } } },
                { $group: { _id: null, total: { $sum: "$dueAmountFils" } } },
            ]),
            // Customer count
            Customer_1.CustomerModel.countDocuments({ isActive: true }),
            // Total Invoices
            Invoice_1.InvoiceModel.countDocuments({ status: { $ne: shared_1.InvoiceStatus.VOID } }),
            // Unpaid invoices
            Invoice_1.InvoiceModel.countDocuments({ status: { $in: [shared_1.InvoiceStatus.ISSUED, shared_1.InvoiceStatus.PARTIALLY_PAID] } }),
            // Available cash accounts (1010, 1020)
            Account_1.AccountModel.find({ code: { $in: ["1010", "1020"] } }),
            // Recent invoices
            Invoice_1.InvoiceModel.find({ status: { $ne: shared_1.InvoiceStatus.VOID } }).sort({ createdAt: -1 }).limit(5),
            // Recent payments
            Payment_1.PaymentModel.find().sort({ createdAt: -1 }).limit(5),
            // Monthly Revenue for current year
            Invoice_1.InvoiceModel.aggregate([
                { $match: { status: { $in: [shared_1.InvoiceStatus.ISSUED, shared_1.InvoiceStatus.PARTIALLY_PAID, shared_1.InvoiceStatus.PAID, shared_1.InvoiceStatus.OVERDUE] } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$issueDate" } },
                        revenueFils: { $sum: "$grandTotalFils" },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            // Monthly Expenses
            Expense_1.ExpenseModel.aggregate([
                { $match: { status: "POSTED" } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$expenseDate" } },
                        expenseFils: { $sum: "$amountFils" },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);
        const totalInvoicedFils = invoicedAgg[0]?.total || 0;
        const outstandingReceivablesFils = invoicedAgg[0]?.outstanding || 0;
        const totalCollectedFils = paymentsAgg[0]?.total || 0;
        const totalExpensesFils = expensesAgg[0]?.total || 0;
        const overdueInvoicesFils = overdueAgg[0]?.total || 0;
        const netProfitFils = totalInvoicedFils - totalExpensesFils;
        let availableCashFils = 0;
        for (const acc of cashAccounts) {
            availableCashFils += acc.currentBalanceFils;
        }
        // Combine monthly revenue and expenses
        const monthsMap = new Map();
        for (const rev of monthlyRevenueAgg) {
            monthsMap.set(rev._id, { month: rev._id, revenueFils: rev.revenueFils, expenseFils: 0 });
        }
        for (const exp of monthlyExpenseAgg) {
            const existing = monthsMap.get(exp._id) || { month: exp._id, revenueFils: 0, expenseFils: 0 };
            existing.expenseFils = exp.expenseFils;
            monthsMap.set(exp._id, existing);
        }
        const revenueByMonth = Array.from(monthsMap.values()).sort((a, b) => a.month.localeCompare(b.month));
        res.json({
            success: true,
            data: {
                totalInvoicedFils,
                totalCollectedFils,
                outstandingReceivablesFils,
                overdueInvoicesFils,
                totalExpensesFils,
                netProfitFils,
                availableCashFils,
                totalActiveCustomers: customerCount,
                totalInvoicesCount,
                unpaidInvoicesCount,
                revenueByMonth,
                recentInvoices,
                recentPayments,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
