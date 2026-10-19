import mongoose, { Schema, Document } from "mongoose";

export interface IServiceDocument extends Document {
  name: string;
  code: string;
  category: string;
  description?: string;
  defaultRateFils: number;
  costFils: number;
  governmentFeesFils: number;
  revenueAccountCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IServiceDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: { type: String, required: true, index: true },
    description: { type: String, trim: true },
    defaultRateFils: { type: Number, required: true, min: 0 },
    costFils: { type: Number, default: 0 },
    governmentFeesFils: { type: Number, default: 0 },
    revenueAccountCode: { type: String, default: "4010" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const ServiceModel = mongoose.model<IServiceDocument>("Service", ServiceSchema);
