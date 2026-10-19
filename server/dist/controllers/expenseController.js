"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listExpenses = listExpenses;
exports.createExpense = createExpense;
const Expense_1 = require("../models/Expense");
const Sequence_1 = require("../models/Sequence");
const financialService_1 = require("../services/financialService");
const shared_1 = require("@immigra/shared");
const shared_2 = require("@immigra/shared");
const AuditLog_1 = require("../models/AuditLog");
async function listExpenses(req, res) {
    try {
        const { category, search, page = 1, limit = 50 } = req.query;
        const query = {};
        if (category)
            query.category = category;
        if (search) {
            const regex = new RegExp(String(search), "i");
            query.$or = [{ payee: regex }, { expenseNumber: regex }, { notes: regex }];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [expenses, total] = await Promise.all([
            Expense_1.ExpenseModel.find(query).sort({ expenseDate: -1 }).skip(skip).limit(Number(limit)),
            Expense_1.ExpenseModel.countDocuments(query),
        ]);
        res.json({
            success: true,
            data: {
                expenses,
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
async function createExpense(req, res) {
    try {
        const parsed = shared_2.ExpenseCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, errors: parsed.error.flatten() });
            return;
        }
        const { amountAed, expenseDate, ...rest } = parsed.data;
        const seq = await (0, Sequence_1.getNextSequence)("EXPENSE_SEQUENCE", 1001);
        const expenseNumber = `EXP/2026/${seq}`;
        const amountFils = (0, shared_1.aedToFils)(amountAed);
        const expense = await Expense_1.ExpenseModel.create({
            expenseNumber,
            expenseDate: new Date(expenseDate),
            amountFils,
            ...rest,
            status: "POSTED",
            createdById: req.user?.userId,
        });
        if (req.user) {
            const journalEntryId = await financialService_1.FinancialService.postExpenseJournal(expense, req.user.userId);
            expense.journalEntryId = journalEntryId;
            await expense.save();
            await AuditLog_1.AuditLogModel.create({
                userId: req.user.userId,
                userName: req.user.name,
                action: "RECORD_EXPENSE",
                entityType: "EXPENSE",
                entityId: expense._id.toString(),
                details: { expenseNumber, payee: expense.payee, amountFils },
            });
        }
        res.status(201).json({ success: true, data: expense });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
