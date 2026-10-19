import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { InvoiceModel } from "../models/Invoice";
import { PaymentModel } from "../models/Payment";
import { ExpenseModel } from "../models/Expense";
import { CustomerModel } from "../models/Customer";
import { AccountModel } from "../models/Account";
import { InvoiceStatus } from "@immigra/shared";

export async function getDashboardOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const now = new Date();

    const [
      invoicedAgg,
      paymentsAgg,
      expensesAgg,
      overdueAgg,
      customerCount,
      totalInvoicesCount,
      unpaidInvoicesCount,
      cashAccounts,
      recentInvoices,
      recentPayments,
      monthlyRevenueAgg,
      monthlyExpenseAgg,
    ] = await Promise.all([
      // Total Invoiced (issued / paid / partially paid)
      InvoiceModel.aggregate([
        { $match: { status: { $in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.OVERDUE] } } },
        { $group: { _id: null, total: { $sum: "$grandTotalFils" }, outstanding: { $sum: "$dueAmountFils" } } },
      ]),
      // Total Collected
      PaymentModel.aggregate([
        { $group: { _id: null, total: { $sum: "$amountFils" } } },
      ]),
      // Total Expenses
      ExpenseModel.aggregate([
        { $match: { status: "POSTED" } },
        { $group: { _id: null, total: { $sum: "$amountFils" } } },
      ]),
      // Overdue
      InvoiceModel.aggregate([
        { $match: { status: { $in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID] }, dueDate: { $lt: now } } },
        { $group: { _id: null, total: { $sum: "$dueAmountFils" } } },
      ]),
      // Customer count
      CustomerModel.countDocuments({ isActive: true }),
      // Total Invoices
      InvoiceModel.countDocuments({ status: { $ne: InvoiceStatus.VOID } }),
      // Unpaid invoices
      InvoiceModel.countDocuments({ status: { $in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID] } }),
      // Available cash accounts (1010, 1020)
      AccountModel.find({ code: { $in: ["1010", "1020"] } }),
      // Recent invoices
      InvoiceModel.find({ status: { $ne: InvoiceStatus.VOID } }).sort({ createdAt: -1 }).limit(5),
      // Recent payments
      PaymentModel.find().sort({ createdAt: -1 }).limit(5),
      // Monthly Revenue for current year
      InvoiceModel.aggregate([
        { $match: { status: { $in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.OVERDUE] } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$issueDate" } },
            revenueFils: { $sum: "$grandTotalFils" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Monthly Expenses
      ExpenseModel.aggregate([
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
    const monthsMap = new Map<string, { month: string; revenueFils: number; expenseFils: number }>();
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
