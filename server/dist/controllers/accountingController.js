"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChartOfAccounts = getChartOfAccounts;
exports.getJournalEntries = getJournalEntries;
exports.getGeneralLedger = getGeneralLedger;
exports.getTrialBalance = getTrialBalance;
exports.getProfitAndLoss = getProfitAndLoss;
exports.getBalanceSheet = getBalanceSheet;
exports.createManualJournalEntry = createManualJournalEntry;
const Account_1 = require("../models/Account");
const JournalEntry_1 = require("../models/JournalEntry");
const Sequence_1 = require("../models/Sequence");
const shared_1 = require("@immigra/shared");
const AuditLog_1 = require("../models/AuditLog");
async function getChartOfAccounts(req, res) {
    try {
        const accounts = await Account_1.AccountModel.find().sort({ code: 1 });
        res.json({ success: true, data: accounts });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function getJournalEntries(req, res) {
    try {
        const { fromDate, toDate, page = 1, limit = 50 } = req.query;
        const query = {};
        if (fromDate || toDate) {
            query.date = {};
            if (fromDate)
                query.date.$gte = new Date(String(fromDate));
            if (toDate)
                query.date.$lte = new Date(String(toDate));
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [entries, total] = await Promise.all([
            JournalEntry_1.JournalEntryModel.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(Number(limit)),
            JournalEntry_1.JournalEntryModel.countDocuments(query),
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function getGeneralLedger(req, res) {
    try {
        const { accountCode, fromDate, toDate } = req.query;
        const pipeline = [
            { $unwind: "$lines" },
        ];
        if (accountCode) {
            pipeline.push({ $match: { "lines.accountCode": accountCode } });
        }
        if (fromDate || toDate) {
            const dateMatch = {};
            if (fromDate)
                dateMatch.$gte = new Date(String(fromDate));
            if (toDate)
                dateMatch.$lte = new Date(String(toDate));
            pipeline.unshift({ $match: { date: dateMatch } });
        }
        pipeline.push({ $sort: { date: 1, createdAt: 1 } }, {
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
        });
        const ledger = await JournalEntry_1.JournalEntryModel.aggregate(pipeline);
        res.json({ success: true, data: ledger });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function getTrialBalance(req, res) {
    try {
        const accounts = await Account_1.AccountModel.find().sort({ code: 1 });
        // Aggregate debits and credits per account from journal entries
        const ledgerTotals = await JournalEntry_1.JournalEntryModel.aggregate([
            { $unwind: "$lines" },
            {
                $group: {
                    _id: "$lines.accountCode",
                    totalDebitFils: { $sum: "$lines.debitFils" },
                    totalCreditFils: { $sum: "$lines.creditFils" },
                },
            },
        ]);
        const totalsMap = new Map();
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function getProfitAndLoss(req, res) {
    try {
        const { fromDate, toDate } = req.query;
        const matchStage = {};
        if (fromDate || toDate) {
            matchStage.date = {};
            if (fromDate)
                matchStage.date.$gte = new Date(String(fromDate));
            if (toDate)
                matchStage.date.$lte = new Date(String(toDate));
        }
        const journalTotals = await JournalEntry_1.JournalEntryModel.aggregate([
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
        const totalsMap = new Map();
        for (const item of journalTotals) {
            totalsMap.set(item._id, item);
        }
        const accounts = await Account_1.AccountModel.find({
            type: { $in: [shared_1.AccountType.REVENUE, shared_1.AccountType.EXPENSE] },
        }).sort({ code: 1 });
        const revenues = [];
        const expenses = [];
        let totalRevenueFils = 0;
        let totalExpenseFils = 0;
        for (const acc of accounts) {
            const totals = totalsMap.get(acc.code) || { totalDebitFils: 0, totalCreditFils: 0 };
            if (acc.type === shared_1.AccountType.REVENUE) {
                // Revenue normal balance is Credit
                const netFils = totals.totalCreditFils - totals.totalDebitFils;
                revenues.push({ code: acc.code, name: acc.name, amountFils: netFils });
                totalRevenueFils += netFils;
            }
            else {
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function getBalanceSheet(req, res) {
    try {
        const accounts = await Account_1.AccountModel.find().sort({ code: 1 });
        const journalTotals = await JournalEntry_1.JournalEntryModel.aggregate([
            { $unwind: "$lines" },
            {
                $group: {
                    _id: "$lines.accountCode",
                    totalDebitFils: { $sum: "$lines.debitFils" },
                    totalCreditFils: { $sum: "$lines.creditFils" },
                },
            },
        ]);
        const totalsMap = new Map();
        for (const item of journalTotals) {
            totalsMap.set(item._id, item);
        }
        const assets = [];
        const liabilities = [];
        const equity = [];
        let totalAssetsFils = 0;
        let totalLiabilitiesFils = 0;
        let totalEquityFils = 0;
        let retainedEarningsFils = 0;
        for (const acc of accounts) {
            const totals = totalsMap.get(acc.code) || { totalDebitFils: 0, totalCreditFils: 0 };
            if (acc.type === shared_1.AccountType.ASSET) {
                const netFils = totals.totalDebitFils - totals.totalCreditFils;
                assets.push({ code: acc.code, name: acc.name, amountFils: netFils });
                totalAssetsFils += netFils;
            }
            else if (acc.type === shared_1.AccountType.LIABILITY) {
                const netFils = totals.totalCreditFils - totals.totalDebitFils;
                liabilities.push({ code: acc.code, name: acc.name, amountFils: netFils });
                totalLiabilitiesFils += netFils;
            }
            else if (acc.type === shared_1.AccountType.EQUITY) {
                const netFils = totals.totalCreditFils - totals.totalDebitFils;
                equity.push({ code: acc.code, name: acc.name, amountFils: netFils });
                totalEquityFils += netFils;
            }
            else if (acc.type === shared_1.AccountType.REVENUE) {
                retainedEarningsFils += totals.totalCreditFils - totals.totalDebitFils;
            }
            else if (acc.type === shared_1.AccountType.EXPENSE) {
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function createManualJournalEntry(req, res) {
    try {
        const { date, description, lines } = req.body;
        if (!lines || !Array.isArray(lines) || lines.length < 2) {
            res.status(400).json({ success: false, message: "A journal entry must have at least two lines" });
            return;
        }
        const seq = await (0, Sequence_1.getNextSequence)("JOURNAL_ENTRY", 1001);
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
        const entry = await JournalEntry_1.JournalEntryModel.create({
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
            await AuditLog_1.AuditLogModel.create({
                userId: req.user.userId,
                userName: req.user.name,
                action: "MANUAL_JOURNAL",
                entityType: "JOURNAL_ENTRY",
                entityId: entry._id.toString(),
                details: { entryNumber, totalDebitFils },
            });
        }
        res.status(201).json({ success: true, data: entry });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
