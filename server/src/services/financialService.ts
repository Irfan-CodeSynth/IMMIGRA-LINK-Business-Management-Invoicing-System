import mongoose from "mongoose";
import { AccountModel } from "../models/Account";
import { JournalEntryModel } from "../models/JournalEntry";
import { CustomerModel } from "../models/Customer";
import { InvoiceModel } from "../models/Invoice";
import { getNextSequence } from "../models/Sequence";
import { InvoiceStatus } from "@immigra/shared";

export class FinancialService {
  /**
   * Updates account current balance atomically
   */
  private static async adjustAccountBalance(
    accountCode: string,
    deltaFils: number,
    session?: mongoose.ClientSession
  ): Promise<void> {
    await AccountModel.findOneAndUpdate(
      { code: accountCode },
      { $inc: { currentBalanceFils: deltaFils } },
      { session, upsert: false }
    );
  }

  /**
   * Posts double-entry journal for an issued invoice:
   * DR: 1200 Accounts Receivable
   * CR: 4010 / 4020 / 4030 / 4040 Service Revenue
   */
  public static async postInvoiceJournal(
    invoice: any,
    userId: string,
    session?: mongoose.ClientSession
  ): Promise<string> {
    const seq = await getNextSequence("JOURNAL_ENTRY", 1001);
    const entryNumber = `JE/2026/${seq}`;

    // Get accounts to fetch friendly names
    const arAccount = await AccountModel.findOne({ code: "1200" }).session(session || null);
    const revAccount = await AccountModel.findOne({ code: "4010" }).session(session || null);

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

    const [journalEntry] = await JournalEntryModel.create(
      [
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
      ],
      { session }
    );

    // Update Accounts: AR increases (Asset debit +), Revenue increases (Revenue credit +)
    await this.adjustAccountBalance("1200", invoice.grandTotalFils, session);
    await this.adjustAccountBalance("4010", invoice.grandTotalFils, session);

    // Update customer outstanding balance
    await CustomerModel.findByIdAndUpdate(
      invoice.customerId,
      { $inc: { balanceFils: invoice.grandTotalFils } },
      { session }
    );

    return journalEntry._id.toString();
  }

  /**
   * Posts double-entry journal for customer payment received:
   * DR: Cash (1010) or Bank (1020)
   * CR: 1200 Accounts Receivable (for allocated) & 2020 Customer Advances (for unallocated)
   */
  public static async postPaymentJournal(
    payment: any,
    userId: string,
    session?: mongoose.ClientSession
  ): Promise<string> {
    const seq = await getNextSequence("JOURNAL_ENTRY", 1001);
    const entryNumber = `JE/2026/${seq}`;

    const depositAccount = await AccountModel.findOne({ code: payment.depositAccountCode }).session(session || null);
    const arAccount = await AccountModel.findOne({ code: "1200" }).session(session || null);
    const advAccount = await AccountModel.findOne({ code: "2020" }).session(session || null);

    const lines: any[] = [
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

    const [journalEntry] = await JournalEntryModel.create(
      [
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
      ],
      { session }
    );

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
    await CustomerModel.findByIdAndUpdate(
      payment.customerId,
      { $inc: { balanceFils: -payment.amountFils } },
      { session }
    );

    // Update allocated invoices
    for (const alloc of payment.allocations || []) {
      const inv = await InvoiceModel.findById(alloc.invoiceId).session(session || null);
      if (inv) {
        const newPaid = inv.paidAmountFils + alloc.allocatedAmountFils;
        const newDue = Math.max(0, inv.grandTotalFils - newPaid);
        const newStatus = newDue === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;
        await InvoiceModel.findByIdAndUpdate(
          alloc.invoiceId,
          {
            $set: {
              paidAmountFils: newPaid,
              dueAmountFils: newDue,
              status: newStatus,
            },
          },
          { session }
        );
      }
    }

    return journalEntry._id.toString();
  }

  /**
   * Posts double-entry journal for operational expense:
   * DR: 5xxx Expense Account
   * CR: 1010 / 1020 Cash / Bank Account
   */
  public static async postExpenseJournal(
    expense: any,
    userId: string,
    session?: mongoose.ClientSession
  ): Promise<string> {
    const seq = await getNextSequence("JOURNAL_ENTRY", 1001);
    const entryNumber = `JE/2026/${seq}`;

    const expAccount = await AccountModel.findOne({ code: expense.expenseAccountCode }).session(session || null);
    const payAccount = await AccountModel.findOne({ code: expense.paymentAccountCode }).session(session || null);

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

    const [journalEntry] = await JournalEntryModel.create(
      [
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
      ],
      { session }
    );

    // Adjust accounts: Expense increases (Debit +), Payment account decreases (Asset credit -)
    await this.adjustAccountBalance(expense.expenseAccountCode, expense.amountFils, session);
    await this.adjustAccountBalance(expense.paymentAccountCode, -expense.amountFils, session);

    return journalEntry._id.toString();
  }
}
