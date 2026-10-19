import mongoose, { Schema, Document } from "mongoose";
import { PaymentMethod } from "@immigra/shared";

export interface IPaymentDocument extends Document {
  receiptNumber: string;
  customerId: mongoose.Types.ObjectId;
  customerName?: string;
  paymentDate: Date;
  amountFils: number;
  paymentMethod: PaymentMethod;
  depositAccountCode: string;
  referenceNumber?: string;
  allocations: {
    invoiceId: mongoose.Types.ObjectId;
    invoiceNumber: string;
    allocatedAmountFils: number;
  }[];
  unallocatedBalanceFils: number;
  notes?: string;
  createdById: mongoose.Types.ObjectId;
  journalEntryId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    receiptNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    customerName: { type: String },
    paymentDate: { type: Date, required: true, index: true },
    amountFils: { type: Number, required: true, min: 1 },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.CASH,
      required: true,
    },
    depositAccountCode: { type: String, default: "1010", required: true },
    referenceNumber: { type: String },
    allocations: [
      {
        invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
        invoiceNumber: { type: String, required: true },
        allocatedAmountFils: { type: Number, required: true, min: 1 },
      },
    ],
    unallocatedBalanceFils: { type: Number, default: 0 },
    notes: { type: String },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    journalEntryId: { type: Schema.Types.ObjectId, ref: "JournalEntry" },
  },
  { timestamps: true }
);

export const PaymentModel = mongoose.model<IPaymentDocument>("Payment", PaymentSchema);
