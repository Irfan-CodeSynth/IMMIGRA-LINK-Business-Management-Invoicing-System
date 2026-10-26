"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialService = void 0;
const Account_1 = require("../models/Account");
const JournalEntry_1 = require("../models/JournalEntry");
const Customer_1 = require("../models/Customer");
const Invoice_1 = require("../models/Invoice");
const Sequence_1 = require("../models/Sequence");
const shared_1 = require("@immigra/shared");
class FinancialService {
    /**
     * Updates account current balance atomically
     */
    static async adjustAccountBalance(accountCode, deltaFils, session) {
        await Account_1.AccountModel.findOneAndUpdate({ code: accountCode }, { $inc: { currentBalanceFils: deltaFils } }, { session, upsert: false });
    }
    /**
     * Posts double-entry journal for an issued invoice:
     * DR: 1200 Accounts Receivable
     * CR: 4010 / 4020 / 4030 / 4040 Service Revenue
     */
    static async postInvoiceJournal(invoice, userId, session) {
        const seq = await (0, Sequence_1.getNextSequence)("JOURNAL_ENTRY", 1001);
        const entryNumber = `JE/2026/${seq}`;
        // Get accounts to fetch friendly names
        const arAccount = await Account_1.AccountModel.findOne({ code: "1200" }).session(session || null);
        const revAccount = await Account_1.AccountModel.findOne({ code: "4010" }).session(session || null);
        const lines = [
            {
                accountCode: "1200",
                accountName: arAccount?.name || "Accounts Receivable (Debtors)",
                description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerSnapshot.displayName}`,
                debitFils: invoice.grandTotalFils,
                creditFils: 0,
            },
            {
                accountCode: "4010",
                accountName: revAccount?.name || "Service Revenue",
                description: `Revenue from Invoice ${invoice.invoiceNumber}`,
                debitFils: 0,
                creditFils: invoice.grandTotalFils,
            },
        ];
        const [journalEntry] = await JournalEntry_1.JournalEntryModel.create([
            {
                entryNumber,
                date: invoice.issueDate || new Date(),
                description: `Invoice Issued: ${invoice.invoiceNumber} for ${invoice.customerSnapshot.displayName}`,
                sourceDocumentType: "INVOICE",
                sourceDocumentId: invoice._id,
                lines,
                totalDebitFils: invoice.grandTotalFils,
                totalCreditFils: invoice.grandTotalFils,
                createdById: userId,
            },
        ], { session });
        // Update Accounts: AR increases (Asset debit +), Revenue increases (Revenue credit +)
        await this.adjustAccountBalance("1200", invoice.grandTotalFils, session);
        await this.adjustAccountBalance("4010", invoice.grandTotalFils, session);
        // Update customer outstanding balance
        await Customer_1.CustomerModel.findByIdAndUpdate(invoice.customerId, { $inc: { balanceFils: invoice.grandTotalFils } }, { session });
        return journalEntry._id.toString();
    }
    /**
     * Adjusts double-entry journal and balances when an issued invoice is edited
     */
    static async adjustInvoiceJournal(invoice, deltaFils, userId, session) {
        if (deltaFils === 0)
            return;
        if (invoice.journalEntryId) {
            const entry = await JournalEntry_1.JournalEntryModel.findById(invoice.journalEntryId).session(session || null);
            if (entry) {
                entry.totalDebitFils = invoice.grandTotalFils;
                entry.totalCreditFils = invoice.grandTotalFils;
                for (const line of entry.lines) {
                    if (line.accountCode === "1200") {
                        line.debitFils = invoice.grandTotalFils;
                    }
                    else if (line.accountCode === "4010") {
                        line.creditFils = invoice.grandTotalFils;
                    }
                }
                await entry.save({ session });
            }
        }
        // Update Accounts: AR changes by delta, Revenue changes by delta
        await this.adjustAccountBalance("1200", deltaFils, session);
        await this.adjustAccountBalance("4010", deltaFils, session);
    }
    /**
     * Posts double-entry journal for customer payment received:
     * DR: Cash (1010) or Bank (1020)
     * CR: 1200 Accounts Receivable (for allocated) & 2020 Customer Advances (for unallocated)
     */
    static async postPaymentJournal(payment, userId, session) {
        const seq = await (0, Sequence_1.getNextSequence)("JOURNAL_ENTRY", 1001);
        const entryNumber = `JE/2026/${seq}`;
        const depositAccount = await Account_1.AccountModel.findOne({ code: payment.depositAccountCode }).session(session || null);
        const arAccount = await Account_1.AccountModel.findOne({ code: "1200" }).session(session || null);
        const advAccount = await Account_1.AccountModel.findOne({ code: "2020" }).session(session || null);
        const lines = [
            {
                accountCode: payment.depositAccountCode,
                accountName: depositAccount?.name || "Deposit Account",
                description: `Receipt ${payment.receiptNumber} received from ${payment.customerName || "Customer"}`,
                debitFils: payment.amountFils,
                creditFils: 0,
            },
        ];
        let allocatedTotalFils = 0;
        for (const alloc of payment.allocations || []) {
            allocatedTotalFils += alloc.allocatedAmountFils;
        }
        if (allocatedTotalFils > 0) {
            lines.push({
                accountCode: "1200",
                accountName: arAccount?.name || "Accounts Receivable",
                description: `Payment allocation against invoices for Receipt ${payment.receiptNumber}`,
                debitFils: 0,
                creditFils: allocatedTotalFils,
            });
        }
        const unallocatedFils = payment.amountFils - allocatedTotalFils;
        if (unallocatedFils > 0) {
            lines.push({
                accountCode: "2020",
                accountName: advAccount?.name || "Customer Advance Deposits",
                description: `Unallocated credit deposit for Receipt ${payment.receiptNumber}`,
                debitFils: 0,
                creditFils: unallocatedFils,
            });
        }
        const [journalEntry] = await JournalEntry_1.JournalEntryModel.create([
            {
                entryNumber,
                date: payment.paymentDate || new Date(),
                description: `Payment Receipt: ${payment.receiptNumber} - ${payment.paymentMethod}`,
                sourceDocumentType: "PAYMENT",
                sourceDocumentId: payment._id,
                lines,
                totalDebitFils: payment.amountFils,
                totalCreditFils: payment.amountFils,
                createdById: userId,
            },
        ], { session });
        // Adjust balances: Deposit account increases (Asset Debit +)
        await this.adjustAccountBalance(payment.depositAccountCode, payment.amountFils, session);
        // AR decreases (Asset Credit -)
        if (allocatedTotalFils > 0) {
            await this.adjustAccountBalance("1200", -allocatedTotalFils, session);
        }
        // Customer Advances increases (Liability Credit +)
        if (unallocatedFils > 0) {
            await this.adjustAccountBalance("2020", unallocatedFils, session);
        }
        // Decrement customer outstanding balance
        await Customer_1.CustomerModel.findByIdAndUpdate(payment.customerId, { $inc: { balanceFils: -payment.amountFils } }, { session });
        // Update allocated invoices
        for (const alloc of payment.allocations || []) {
            const inv = await Invoice_1.InvoiceModel.findById(alloc.invoiceId).session(session || null);
            if (inv) {
                const newPaid = inv.paidAmountFils + alloc.allocatedAmountFils;
                const newDue = Math.max(0, inv.grandTotalFils - newPaid);
                const newStatus = newDue === 0 ? shared_1.InvoiceStatus.PAID : shared_1.InvoiceStatus.PARTIALLY_PAID;
                await Invoice_1.InvoiceModel.findByIdAndUpdate(alloc.invoiceId, {
                    $set: {
                        paidAmountFils: newPaid,
                        dueAmountFils: newDue,
                        status: newStatus,
                    },
                }, { session });
            }
        }
        return journalEntry._id.toString();
    }
    /**
     * Posts double-entry journal for operational expense:
     * DR: 5xxx Expense Account
     * CR: 1010 / 1020 Cash / Bank Account
     */
    static async postExpenseJournal(expense, userId, session) {
        const seq = await (0, Sequence_1.getNextSequence)("JOURNAL_ENTRY", 1001);
        const entryNumber = `JE/2026/${seq}`;
        const expAccount = await Account_1.AccountModel.findOne({ code: expense.expenseAccountCode }).session(session || null);
        const payAccount = await Account_1.AccountModel.findOne({ code: expense.paymentAccountCode }).session(session || null);
        const lines = [
            {
                accountCode: expense.expenseAccountCode,
                accountName: expAccount?.name || "Operating Expense",
                description: `Expense ${expense.expenseNumber} to ${expense.payee}: ${expense.category}`,
                debitFils: expense.amountFils,
                creditFils: 0,
            },
            {
                accountCode: expense.paymentAccountCode,
                accountName: payAccount?.name || "Payment Account",
                description: `Disbursement for ${expense.expenseNumber}`,
                debitFils: 0,
                creditFils: expense.amountFils,
            },
        ];
        const [journalEntry] = await JournalEntry_1.JournalEntryModel.create([
            {
                entryNumber,
                date: expense.expenseDate || new Date(),
                description: `Expense: ${expense.expenseNumber} (${expense.category}) to ${expense.payee}`,
                sourceDocumentType: "EXPENSE",
                sourceDocumentId: expense._id,
                lines,
                totalDebitFils: expense.amountFils,
                totalCreditFils: expense.amountFils,
                createdById: userId,
            },
        ], { session });
        // Adjust accounts: Expense increases (Debit +), Payment account decreases (Asset credit -)
        await this.adjustAccountBalance(expense.expenseAccountCode, expense.amountFils, session);
        await this.adjustAccountBalance(expense.paymentAccountCode, -expense.amountFils, session);
        return journalEntry._id.toString();
    }
}
exports.FinancialService = FinancialService;
