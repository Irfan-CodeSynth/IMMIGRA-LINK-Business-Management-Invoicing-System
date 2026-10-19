import mongoose, { Schema, Document } from "mongoose";
import { CustomerType } from "@immigra/shared";

export interface ICustomerDocument extends Document {
  customerType: CustomerType;
  referenceNumber: string;
  displayName: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  whatsapp?: string;
  nationality?: string;
  address?: {
    street?: string;
    city?: string;
    emirate?: string;
    poBox?: string;
  };
  tradeLicenseNumber?: string;
  trn?: string;
  notes?: string;
  isActive: boolean;
  balanceFils: number;
  documents: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize?: number;
    uploadedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    customerType: {
      type: String,
      enum: Object.values(CustomerType),
      default: CustomerType.INDIVIDUAL,
      required: true,
    },
    referenceNumber: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true, trim: true, index: true },
    companyName: { type: String, trim: true, index: true },
    contactPerson: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    whatsapp: { type: String, trim: true },
    nationality: { type: String, trim: true },
    address: {
      street: { type: String },
      city: { type: String, default: "Dubai" },
      emirate: { type: String, default: "Dubai" },
      poBox: { type: String },
    },
    tradeLicenseNumber: { type: String, trim: true },
    trn: { type: String, trim: true },
    notes: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    balanceFils: { type: Number, default: 0 },
    documents: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String, required: true },
        fileSize: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

CustomerSchema.index({
  displayName: "text",
  companyName: "text",
  phone: "text",
  email: "text",
  referenceNumber: "text",
});

export const CustomerModel = mongoose.model<ICustomerDocument>("Customer", CustomerSchema);
