import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { ExpenseModel } from "../models/Expense";
import { getNextSequence } from "../models/Sequence";
import { FinancialService } from "../services/financialService";
import { aedToFils } from "@immigra/shared";
import { ExpenseCreateSchema } from "@immigra/shared";
import { AuditLogModel } from "../models/AuditLog";

export async function listExpenses(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const query: any = {};
    if (category) query.category = category;
    if (search) {
      const regex = new RegExp(String(search), "i");
      query.$or = [{ payee: regex }, { expenseNumber: regex }, { notes: regex }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [expenses, total] = await Promise.all([
      ExpenseModel.find(query).sort({ expenseDate: -1 }).skip(skip).limit(Number(limit)),
      ExpenseModel.countDocuments(query),
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = ExpenseCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }

    const { amountAed, expenseDate, ...rest } = parsed.data;
    const seq = await getNextSequence("EXPENSE_SEQUENCE", 1001);
    const expenseNumber = `EXP/2026/${seq}`;
    const amountFils = aedToFils(amountAed);

    const expense = await ExpenseModel.create({
      expenseNumber,
      expenseDate: new Date(expenseDate),
      amountFils,
      ...rest,
      status: "POSTED",
      createdById: req.user?.userId,
    });

    if (req.user) {
      const journalEntryId = await FinancialService.postExpenseJournal(expense, req.user.userId);
      expense.journalEntryId = journalEntryId as any;
      await expense.save();

      await AuditLogModel.create({
        userId: req.user.userId,
        userName: req.user.name,
        action: "RECORD_EXPENSE",
        entityType: "EXPENSE",
        entityId: expense._id.toString(),
        details: { expenseNumber, payee: expense.payee, amountFils },
      });
    }

    res.status(201).json({ success: true, data: expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const expense = await ExpenseModel.findById(req.params.id);
    if (!expense) {
      res.status(404).json({ success: false, message: "Expense voucher not found" });
      return;
    }
    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const expense = await ExpenseModel.findById(req.params.id);
    if (!expense) {
      res.status(404).json({ success: false, message: "Expense not found" });
      return;
    }

    const { payee, category, notes, paymentMethod, referenceNumber } = req.body;
    if (payee !== undefined) expense.payee = payee;
    if (category !== undefined) expense.category = category;
    if (notes !== undefined) expense.notes = notes;
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    if (referenceNumber !== undefined) expense.referenceNumber = referenceNumber;

    await expense.save();

    if (req.user) {
      await AuditLogModel.create({
        userId: req.user.userId,
        userName: req.user.name,
        action: "UPDATE_EXPENSE",
        entityType: "EXPENSE",
        entityId: expense._id.toString(),
        details: { expenseNumber: expense.expenseNumber },
      });
    }

    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const expense = await ExpenseModel.findById(req.params.id);
    if (!expense) {
      res.status(404).json({ success: false, message: "Expense not found" });
      return;
    }

    await ExpenseModel.findByIdAndDelete(expense._id);

    if (req.user) {
      await AuditLogModel.create({
        userId: req.user.userId,
        userName: req.user.name,
        action: "DELETE_EXPENSE",
        entityType: "EXPENSE",
        entityId: expense._id.toString(),
        details: { expenseNumber: expense.expenseNumber, payee: expense.payee },
      });
    }

    res.json({ success: true, message: `Expense voucher "${expense.expenseNumber}" deleted successfully`, data: expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
