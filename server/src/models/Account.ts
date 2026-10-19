import mongoose, { Schema, Document } from "mongoose";
import { AccountType, AccountSubType } from "@immigra/shared";

export interface IAccountDocument extends Document {
  code: string;
  name: string;
  type: AccountType;
  subType: AccountSubType;
  currency: string;
  currentBalanceFils: number;
  isSystem: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccountDocument>(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(AccountType), required: true, index: true },
    subType: { type: String, enum: Object.values(AccountSubType), required: true },
    currency: { type: String, default: "AED" },
    currentBalanceFils: { type: Number, default: 0 },
    isSystem: { type: Boolean, default: false },
    description: { type: String },
  },
  { timestamps: true }
);

export const AccountModel = mongoose.model<IAccountDocument>("Account", AccountSchema);
