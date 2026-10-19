import mongoose, { Schema, Document } from "mongoose";

export interface ICompanySettingsDocument extends Document {
  companyName: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  tradeLicenseNumber: string;
  trn?: string;
  isVatRegistered: boolean;
  currency: string;
  timezone: string;
  bankDetails: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
    swiftCode?: string;
    branch?: string;
  };
  invoicePrefix: string;
  invoiceNextSequence: number;
  invoiceDefaultNotes: string;
  invoicePaymentInstructions: string;
  logoUrl?: string;
}

const CompanySettingsSchema = new Schema<ICompanySettingsDocument>(
  {
    companyName: { type: String, default: "IMMIGRA LINK BUSINESS SERVICES" },
    country: { type: String, default: "United Arab Emirates" },
    city: { type: String, default: "Dubai" },
    address: { type: String, default: "Al Garhoud, Dubai, United Arab Emirates" },
    phone: { type: String, default: "+971 4 295 5555" },
    email: { type: String, default: "info@immigralink.ae" },
    website: { type: String, default: "www.immigralink.ae" },
    tradeLicenseNumber: { type: String, default: "CN-1094829" },
    trn: { type: String, default: "" },
    isVatRegistered: { type: Boolean, default: false },
    currency: { type: String, default: "AED" },
    timezone: { type: String, default: "Asia/Dubai" },
    bankDetails: {
      bankName: { type: String, default: "Emirates NBD" },
      accountTitle: { type: String, default: "IMMIGRA LINK BUSINESS SERVICES" },
      accountNumber: { type: String, default: "1019283746501" },
      iban: { type: String, default: "AE3402600001019283746501" },
      swiftCode: { type: String, default: "EBIBAEAD" },
      branch: { type: String, default: "Deira Main Branch, Dubai" },
    },
    invoicePrefix: { type: String, default: "INV/MAIN/" },
    invoiceNextSequence: { type: Number, default: 1001 },
    invoiceDefaultNotes: {
      type: String,
      default: "Thank you for choosing Immigra Link Business Services. For any inquiries regarding this invoice, please reach out to our customer care.",
    },
    invoicePaymentInstructions: {
      type: String,
      default: "Please make payment via Bank Transfer or Cash at our office counter. Mention the invoice number as the payment reference.",
    },
    logoUrl: { type: String, default: "/uploads/immigra-logo.jpg" },
  },
  { timestamps: true }
);

export const CompanySettingsModel = mongoose.model<ICompanySettingsDocument>(
  "CompanySettings",
  CompanySettingsSchema
);
