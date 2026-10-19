import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { PaymentModel } from "../models/Payment";
import { CustomerModel } from "../models/Customer";
import { InvoiceModel } from "../models/Invoice";
import { getNextSequence } from "../models/Sequence";
import { FinancialService } from "../services/financialService";
import { aedToFils } from "@immigra/shared";
import { PaymentCreateSchema } from "@immigra/shared";
import { AuditLogModel } from "../models/AuditLog";

export async function listPayments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { customerId, page = 1, limit = 50 } = req.query;
    const query: any = {};
    if (customerId) query.customerId = customerId;

    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      PaymentModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      PaymentModel.countDocuments(query),
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const payment = await PaymentModel.findById(req.params.id);
    if (!payment) {
      res.status(404).json({ success: false, message: "Payment receipt not found" });
      return;
    }
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = PaymentCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }

    const { customerId, paymentDate, amountAed, paymentMethod, depositAccountCode, referenceNumber, allocations, notes } = parsed.data;

    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found" });
      return;
    }

    const seq = await getNextSequence("PAYMENT_RECEIPT", 1001);
    const receiptNumber = `REC/2026/${seq}`;
    const amountFils = aedToFils(amountAed);

    let allocatedTotalFils = 0;
    const formattedAllocations = await Promise.all(
      (allocations || []).map(async (a) => {
        const allocFils = aedToFils(a.allocatedAmountAed);
        allocatedTotalFils += allocFils;
        const inv = await InvoiceModel.findById(a.invoiceId);
        return {
          invoiceId: a.invoiceId as any,
          invoiceNumber: inv ? inv.invoiceNumber : "",
          allocatedAmountFils: allocFils,
        };
      })
    );

    if (allocatedTotalFils > amountFils) {
      res.status(400).json({
        success: false,
        message: "Total allocated amount exceeds the received payment amount",
      });
      return;
    }

    const unallocatedBalanceFils = amountFils - allocatedTotalFils;

    const payment = await PaymentModel.create({
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
      const journalEntryId = await FinancialService.postPaymentJournal(payment, req.user.userId);
      payment.journalEntryId = journalEntryId as any;
      await payment.save();
    }

    if (req.user) {
      await AuditLogModel.create({
        userId: req.user.userId,
        userName: req.user.name,
        action: "RECORD_PAYMENT",
        entityType: "PAYMENT",
        entityId: payment._id.toString(),
        details: { receiptNumber, customer: customer.displayName, amountFils },
      });
    }

    res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
