import mongoose, { Schema, Document } from "mongoose";
import { PaymentMethod } from "@immigra/shared";

export interface IExpenseDocument extends Document {
  expenseNumber: string;
  expenseDate: Date;
  category: string;
  expenseAccountCode: string;
  paymentAccountCode: string;
  amountFils: number;
  payee: string;
  supplierId?: mongoose.Types.ObjectId;
  relatedCustomerId?: mongoose.Types.ObjectId;
  relatedServiceName?: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  receiptFileUrl?: string;
  notes?: string;
  status: "POSTED" | "VOID";
  createdById: mongoose.Types.ObjectId;
  journalEntryId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    expenseNumber: { type: String, required: true, unique: true, index: true },
    expenseDate: { type: Date, required: true, index: true },
    category: { type: String, required: true, index: true },
    expenseAccountCode: { type: String, required: true, default: "5010" },
    paymentAccountCode: { type: String, required: true, default: "1010" },
    amountFils: { type: Number, required: true, min: 1 },
    payee: { type: String, required: true, trim: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier" },
    relatedCustomerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    relatedServiceName: { type: String },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.CASH,
    },
    referenceNumber: { type: String },
    receiptFileUrl: { type: String },
    notes: { type: String },
    status: { type: String, enum: ["POSTED", "VOID"], default: "POSTED", index: true },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    journalEntryId: { type: Schema.Types.ObjectId, ref: "JournalEntry" },
  },
  { timestamps: true }
);

export const ExpenseModel = mongoose.model<IExpenseDocument>("Expense", ExpenseSchema);
