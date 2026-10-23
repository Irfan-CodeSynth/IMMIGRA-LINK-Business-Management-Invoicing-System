import mongoose, { Schema, Document } from "mongoose";
import { QuotationStatus } from "@immigra/shared";

export interface IQuotationDocument extends Document {
  quotationNumber: string;
  customerId: mongoose.Types.ObjectId;
  customerSnapshot: {
    displayName: string;
    companyName?: string;
    phone: string;
    email?: string;
    address?: string;
  };
  issueDate: Date;
  expiryDate: Date;
  status: QuotationStatus;
  subtotalFils: number;
  discountFils: number;
  grandTotalFils: number;
  items: {
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
  }[];
  amountInWords: string;
  notes?: string;
  termsAndConditions?: string;
  convertedInvoiceId?: mongoose.Types.ObjectId;
  createdById: mongoose.Types.ObjectId;
  creatorName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationSchema = new Schema<IQuotationDocument>(
  {
    quotationNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    customerSnapshot: {
      displayName: { type: String, required: true },
      companyName: { type: String },
      contactPerson: { type: String },
      clientName: { type: String },
      phone: { type: String, required: true },
      email: { type: String },
      address: { type: String },
    },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(QuotationStatus),
      default: QuotationStatus.DRAFT,
      index: true,
    },
    subtotalFils: { type: Number, required: true, min: 0 },
    discountFils: { type: Number, default: 0 },
    grandTotalFils: { type: Number, required: true, min: 0 },
    items: [
      {
        serviceId: { type: Schema.Types.ObjectId, ref: "Service" },
        serviceName: { type: String, required: true },
        companyName: { type: String, default: "" },
        clientName: { type: String, default: "" },
        category: { type: String, default: "" },
        description: { type: String },
        quantity: { type: Number, required: true, min: 1 },
        unitRateFils: { type: Number, required: true, min: 0 },
        discountFils: { type: Number, default: 0 },
        lineTotalFils: { type: Number, required: true, min: 0 },
      },
    ],
    amountInWords: { type: String, required: true },
    notes: { type: String },
    termsAndConditions: { type: String },
    convertedInvoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    creatorName: { type: String },
  },
  { timestamps: true }
);

export const QuotationModel = mongoose.model<IQuotationDocument>("Quotation", QuotationSchema);
