import mongoose, { Schema, Document } from "mongoose";

export interface ISupplierDocument extends Document {
  supplierName: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  balanceFils: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplierDocument>(
  {
    supplierName: { type: String, required: true, trim: true, index: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String },
    balanceFils: { type: Number, default: 0 },
    notes: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const SupplierModel = mongoose.model<ISupplierDocument>("Supplier", SupplierSchema);
