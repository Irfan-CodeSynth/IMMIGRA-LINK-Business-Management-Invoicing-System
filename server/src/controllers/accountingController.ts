import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { AccountModel } from "../models/Account";
import { JournalEntryModel } from "../models/JournalEntry";
import { getNextSequence } from "../models/Sequence";
import { AccountType } from "@immigra/shared";
import { AuditLogModel } from "../models/AuditLog";

export async function getChartOfAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const accounts = await AccountModel.find().sort({ code: 1 });
    res.json({ success: true, data: accounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getJournalEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { fromDate, toDate, page = 1, limit = 50 } = req.query;
    const query: any = {};
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(String(fromDate));
      if (toDate) query.date.$lte = new Date(String(toDate));
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [entries, total] = await Promise.all([
      JournalEntryModel.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      JournalEntryModel.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        entries,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getGeneralLedger(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { accountCode, fromDate, toDate } = req.query;

    const pipeline: any[] = [
      { $unwind: "$lines" },
    ];

    if (accountCode) {
      pipeline.push({ $match: { "lines.accountCode": accountCode } });
    }

    if (fromDate || toDate) {
      const dateMatch: any = {};
      if (fromDate) dateMatch.$gte = new Date(String(fromDate));
      if (toDate) dateMatch.$lte = new Date(String(toDate));
      pipeline.unshift({ $match: { date: dateMatch } });
    }

    pipeline.push(
      { $sort: { date: 1, createdAt: 1 } },
      {
        $project: {
          entryNumber: 1,
          date: 1,
          description: 1,
          sourceDocumentType: 1,
          accountCode: "$lines.accountCode",
          accountName: "$lines.accountName",
          lineDescription: "$lines.description",
          debitFils: "$lines.debitFils",
          creditFils: "$lines.creditFils",
        },
      }
    );

    const ledger = await JournalEntryModel.aggregate(pipeline);
    res.json({ success: true, data: ledger });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTrialBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const accounts = await AccountModel.find().sort({ code: 1 });

    // Aggregate debits and credits per account from journal entries
    const ledgerTotals = await JournalEntryModel.aggregate([
      { $unwind: "$lines" },
      {
        $group: {
          _id: "$lines.accountCode",
          totalDebitFils: { $sum: "$lines.debitFils" },
          totalCreditFils: { $sum: "$lines.creditFils" },
        },
      },
    ]);

    const totalsMap = new Map<string, { totalDebitFils: number; totalCreditFils: number }>();
    for (const item of ledgerTotals) {
      totalsMap.set(item._id, {
        totalDebitFils: item.totalDebitFils,
        totalCreditFils: item.totalCreditFils,
      });
    }

    let grandTotalDebitFils = 0;
    let grandTotalCreditFils = 0;

    const rows = accounts.map((acc) => {
      const totals = totalsMap.get(acc.code) || { totalDebitFils: 0, totalCreditFils: 0 };
      grandTotalDebitFils += totals.totalDebitFils;
      grandTotalCreditFils += totals.totalCreditFils;

      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        subType: acc.subType,
        debitFils: totals.totalDebitFils,
        creditFils: totals.totalCreditFils,
        netBalanceFils: totals.totalDebitFils - totals.totalCreditFils,
      };
    });

    res.json({
      success: true,
      data: {
        rows,
        grandTotalDebitFils,
        grandTotalCreditFils,
        isBalanced: grandTotalDebitFils === grandTotalCreditFils,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getProfitAndLoss(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { fromDate, toDate } = req.query;
    const matchStage: any = {};
    if (fromDate || toDate) {
      matchStage.date = {};
      if (fromDate) matchStage.date.$gte = new Date(String(fromDate));
      if (toDate) matchStage.date.$lte = new Date(String(toDate));
    }

    const journalTotals = await JournalEntryModel.aggregate([
      ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
      { $unwind: "$lines" },
      {
        $group: {
          _id: "$lines.accountCode",
          totalDebitFils: { $sum: "$lines.debitFils" },
          totalCreditFils: { $sum: "$lines.creditFils" },
        },
      },
    ]);

    const totalsMap = new Map<string, { totalDebitFils: number; totalCreditFils: number }>();
    for (const item of journalTotals) {
      totalsMap.set(item._id, item);
    }

    const accounts = await AccountModel.find({
      type: { $in: [AccountType.REVENUE, AccountType.EXPENSE] },
    }).sort({ code: 1 });

    const revenues: any[] = [];
    const expenses: any[] = [];
    let totalRevenueFils = 0;
    let totalExpenseFils = 0;

    for (const acc of accounts) {
      const totals = totalsMap.get(acc.code) || { totalDebitFils: 0, totalCreditFils: 0 };
      if (acc.type === AccountType.REVENUE) {
        // Revenue normal balance is Credit
        const netFils = totals.totalCreditFils - totals.totalDebitFils;
        revenues.push({ code: acc.code, name: acc.name, amountFils: netFils });
        totalRevenueFils += netFils;
      } else {
        // Expense normal balance is Debit
        const netFils = totals.totalDebitFils - totals.totalCreditFils;
        expenses.push({ code: acc.code, name: acc.name, amountFils: netFils });
        totalExpenseFils += netFils;
      }
    }

    const netProfitFils = totalRevenueFils - totalExpenseFils;

    res.json({
      success: true,
      data: {
        revenues,
        expenses,
        totalRevenueFils,
        totalExpenseFils,
        netProfitFils,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getBalanceSheet(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const accounts = await AccountModel.find().sort({ code: 1 });
    const journalTotals = await JournalEntryModel.aggregate([
      { $unwind: "$lines" },
      {
        $group: {
          _id: "$lines.accountCode",
          totalDebitFils: { $sum: "$lines.debitFils" },
          totalCreditFils: { $sum: "$lines.creditFils" },
        },
      },
    ]);

    const totalsMap = new Map<string, { totalDebitFils: number; totalCreditFils: number }>();
    for (const item of journalTotals) {
      totalsMap.set(item._id, item);
    }

    const assets: any[] = [];
    const liabilities: any[] = [];
    const equity: any[] = [];

    let totalAssetsFils = 0;
    let totalLiabilitiesFils = 0;
    let totalEquityFils = 0;
    let retainedEarningsFils = 0;

    for (const acc of accounts) {
      const totals = totalsMap.get(acc.code) || { totalDebitFils: 0, totalCreditFils: 0 };
      if (acc.type === AccountType.ASSET) {
        const netFils = totals.totalDebitFils - totals.totalCreditFils;
        assets.push({ code: acc.code, name: acc.name, amountFils: netFils });
        totalAssetsFils += netFils;
      } else if (acc.type === AccountType.LIABILITY) {
        const netFils = totals.totalCreditFils - totals.totalDebitFils;
        liabilities.push({ code: acc.code, name: acc.name, amountFils: netFils });
        totalLiabilitiesFils += netFils;
      } else if (acc.type === AccountType.EQUITY) {
        const netFils = totals.totalCreditFils - totals.totalDebitFils;
        equity.push({ code: acc.code, name: acc.name, amountFils: netFils });
        totalEquityFils += netFils;
      } else if (acc.type === AccountType.REVENUE) {
        retainedEarningsFils += totals.totalCreditFils - totals.totalDebitFils;
      } else if (acc.type === AccountType.EXPENSE) {
        retainedEarningsFils -= totals.totalDebitFils - totals.totalCreditFils;
      }
    }

    // Add current period net income to retained earnings in Equity section
    equity.push({
      code: "RE-NET",
      name: "Current Period Net Earnings",
      amountFils: retainedEarningsFils,
    });
    totalEquityFils += retainedEarningsFils;

    res.json({
      success: true,
      data: {
        assets,
        liabilities,
        equity,
        totalAssetsFils,
        totalLiabilitiesFils,
        totalEquityFils,
        totalLiabilitiesAndEquityFils: totalLiabilitiesFils + totalEquityFils,
        isBalanced: totalAssetsFils === totalLiabilitiesFils + totalEquityFils,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createManualJournalEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { date, description, lines } = req.body;
    if (!lines || !Array.isArray(lines) || lines.length < 2) {
      res.status(400).json({ success: false, message: "A journal entry must have at least two lines" });
      return;
    }

    const seq = await getNextSequence("JOURNAL_ENTRY", 1001);
    const entryNumber = `JE/2026/${seq}`;

    let totalDebitFils = 0;
    let totalCreditFils = 0;

    for (const line of lines) {
      totalDebitFils += line.debitFils || 0;
      totalCreditFils += line.creditFils || 0;
    }

    if (totalDebitFils !== totalCreditFils) {
      res.status(400).json({
        success: false,
        message: `Debits (${totalDebitFils} fils) and Credits (${totalCreditFils} fils) must be equal`,
      });
      return;
    }

    const entry = await JournalEntryModel.create({
      entryNumber,
      date: new Date(date),
      description,
      sourceDocumentType: "MANUAL",
      lines,
      totalDebitFils,
      totalCreditFils,
      createdById: req.user?.userId,
    });

    if (req.user) {
      await AuditLogModel.create({
        userId: req.user.userId,
        userName: req.user.name,
        action: "MANUAL_JOURNAL",
        entityType: "JOURNAL_ENTRY",
        entityId: entry._id.toString(),
        details: { entryNumber, totalDebitFils },
      });
    }

    res.status(201).json({ success: true, data: entry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { code, name, type, description } = req.body;
    if (!code || !name || !type) {
      res.status(400).json({ success: false, message: "Code, name, and account type are required" });
      return;
    }

    const existing = await AccountModel.findOne({ code });
    if (existing) {
      res.status(400).json({ success: false, message: `Account with code ${code} already exists` });
      return;
    }

    const account = await AccountModel.create({
      code,
      name,
      type,
      subType: "OTHER_CURRENT_ASSET" as any,
      description: description || "",
      currentBalanceFils: 0,
      isSystem: false,
    });

    res.status(201).json({ success: true, data: account });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, type, description } = req.body;
    const account = await AccountModel.findById(req.params.id);
    if (!account) {
      res.status(404).json({ success: false, message: "Account not found" });
      return;
    }

    if (name !== undefined) account.name = name;
    if (type !== undefined) account.type = type;
    if (description !== undefined) account.description = description;

    await account.save();
    res.json({ success: true, data: account });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const account = await AccountModel.findById(req.params.id);
    if (!account) {
      res.status(404).json({ success: false, message: "Account not found" });
      return;
    }

    if (account.isSystem) {
      res.status(400).json({
        success: false,
        message: `Cannot delete default UAE system account "${account.code} - ${account.name}".`,
      });
      return;
    }

    if (account.currentBalanceFils !== 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete account ${account.code} (${account.name}) with non-zero balance (AED ${(account.currentBalanceFils / 100).toFixed(2)}).`,
      });
      return;
    }

    await AccountModel.findByIdAndDelete(account._id);
    res.json({ success: true, message: `Account "${account.code} - ${account.name}" deleted successfully`, data: account });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteJournalEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const entry = await JournalEntryModel.findById(req.params.id);
    if (!entry) {
      res.status(404).json({ success: false, message: "Journal entry not found" });
      return;
    }

    if (entry.sourceDocumentType !== "MANUAL") {
      res.status(400).json({
        success: false,
        message: `Cannot delete system-generated journal entry linked to ${entry.sourceDocumentType}. Delete or void the source transaction directly.`,
      });
      return;
    }

    // Reverse balances on accounts
    for (const line of entry.lines) {
      const delta = line.debitFils - line.creditFils;
      await AccountModel.findOneAndUpdate(
        { code: line.accountCode },
        { $inc: { currentBalanceFils: -delta } }
      );
    }

    await JournalEntryModel.findByIdAndDelete(entry._id);
    res.json({ success: true, message: `Manual journal entry "${entry.entryNumber}" voided and deleted successfully`, data: entry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
