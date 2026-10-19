import mongoose, { Schema, Document } from "mongoose";

export interface IJournalLineSubdocument {
  accountCode: string;
  accountName: string;
  description?: string;
  debitFils: number;
  creditFils: number;
}

export interface IJournalEntryDocument extends Document {
  entryNumber: string;
  date: Date;
  description: string;
  sourceDocumentType: "INVOICE" | "PAYMENT" | "EXPENSE" | "MANUAL" | "OPENING_BALANCE";
  sourceDocumentId?: mongoose.Types.ObjectId;
  lines: IJournalLineSubdocument[];
  totalDebitFils: number;
  totalCreditFils: number;
  isReversed: boolean;
  reversedEntryId?: mongoose.Types.ObjectId;
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JournalLineSchema = new Schema<IJournalLineSubdocument>(
  {
    accountCode: { type: String, required: true },
    accountName: { type: String, required: true },
    description: { type: String },
    debitFils: { type: Number, default: 0, min: 0 },
    creditFils: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const JournalEntrySchema = new Schema<IJournalEntryDocument>(
  {
    entryNumber: { type: String, required: true, unique: true, index: true },
    date: { type: Date, required: true, index: true },
    description: { type: String, required: true },
    sourceDocumentType: {
      type: String,
      enum: ["INVOICE", "PAYMENT", "EXPENSE", "MANUAL", "OPENING_BALANCE"],
      required: true,
      index: true,
    },
    sourceDocumentId: { type: Schema.Types.ObjectId },
    lines: { type: [JournalLineSchema], required: true },
    totalDebitFils: { type: Number, required: true },
    totalCreditFils: { type: Number, required: true },
    isReversed: { type: Boolean, default: false },
    reversedEntryId: { type: Schema.Types.ObjectId, ref: "JournalEntry" },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

JournalEntrySchema.pre("validate", function (next) {
  let debitSum = 0;
  let creditSum = 0;
  for (const line of this.lines) {
    debitSum += line.debitFils || 0;
    creditSum += line.creditFils || 0;
  }
  this.totalDebitFils = debitSum;
  this.totalCreditFils = creditSum;

  if (debitSum !== creditSum) {
    return next(new Error(`Journal entry unbalanced! Debits: ${debitSum} fils vs Credits: ${creditSum} fils`));
  }
  next();
});

export const JournalEntryModel = mongoose.model<IJournalEntryDocument>("JournalEntry", JournalEntrySchema);
