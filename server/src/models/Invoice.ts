import mongoose, { Schema, Document } from "mongoose";
import { InvoiceStatus } from "@immigra/shared";

export interface IInvoiceItemSubdocument {
  serviceId?: mongoose.Types.ObjectId;
  serviceName: string;
  companyName?: string;
  clientName?: string;
  category?: string;
  description?: string;
  quantity: number;
  unitRateFils: number;
  discountFils: number;
  lineTotalFils: number;
}

export interface IInvoiceDocument extends Document {
  invoiceNumber: string;
  sequenceNumber: number;
  customerId: mongoose.Types.ObjectId;
  customerSnapshot: {
    displayName: string;
    companyName?: string;
    contactPerson?: string;
    clientName?: string;
    phone?: string;
    email?: string;
    address?: string;
    trn?: string;
  };
  issueDate: Date;
  dueDate: Date;
  supplyDate?: Date;
  referenceNote?: string;
  status: InvoiceStatus;
  subtotalFils: number;
  discountFils: number;
  taxFils: number;
  grandTotalFils: number;
  paidAmountFils: number;
  dueAmountFils: number;
  items: IInvoiceItemSubdocument[];
  amountInWords: string;
  barcodeData: string;
  qrVerificationHash: string;
  notes?: string;
  paymentTerms?: string;
  createdById: mongoose.Types.ObjectId;
  creatorName?: string;
  journalEntryId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItemSubdocument>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: "Service" },
    serviceName: { type: String, required: true },
    companyName: { type: String, default: "" },
    clientName: { type: String, default: "" },
    category: { type: String, default: "" },
    description: { type: String },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitRateFils: { type: Number, required: true, min: 0 },
    discountFils: { type: Number, default: 0 },
    lineTotalFils: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoiceDocument>(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    sequenceNumber: { type: Number, required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    customerSnapshot: {
      displayName: { type: String, required: true },
      companyName: { type: String },
      contactPerson: { type: String },
      clientName: { type: String },
      phone: { type: String, default: "" },
      email: { type: String },
      address: { type: String },
      trn: { type: String },
    },
    issueDate: { type: Date, required: true, index: true },
    dueDate: { type: Date, required: true, index: true },
    supplyDate: { type: Date },
    referenceNote: { type: String },
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.ISSUED,
      index: true,
    },
    subtotalFils: { type: Number, required: true, min: 0 },
    discountFils: { type: Number, default: 0 },
    taxFils: { type: Number, default: 0 },
    grandTotalFils: { type: Number, required: true, min: 0 },
    paidAmountFils: { type: Number, default: 0 },
    dueAmountFils: { type: Number, required: true },
    items: { type: [InvoiceItemSchema], required: true },
    amountInWords: { type: String, required: true },
    barcodeData: { type: String, required: true },
    qrVerificationHash: { type: String, required: true, unique: true, index: true },
    notes: { type: String },
    paymentTerms: { type: String },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    creatorName: { type: String },
    journalEntryId: { type: Schema.Types.ObjectId, ref: "JournalEntry" },
  },
  { timestamps: true }
);

InvoiceSchema.index({ createdAt: -1 });
InvoiceSchema.index({ invoiceNumber: "text", "customerSnapshot.displayName": "text" });

export const InvoiceModel = mongoose.model<IInvoiceDocument>("Invoice", InvoiceSchema);
