import mongoose, { Schema, Document } from "mongoose";

export interface ISequenceDocument extends Document {
  key: string;
  sequence: number;
}

const SequenceSchema = new Schema<ISequenceDocument>({
  key: { type: String, required: true, unique: true },
  sequence: { type: Number, required: true, default: 1000 },
});

export const SequenceModel = mongoose.model<ISequenceDocument>("Sequence", SequenceSchema);

/**
 * Format a sequence number:
 * - If sequence < 1000, pads with leading zeros (e.g. 3 -> "003" for "INV-003")
 * - If sequence >= 1000, returns natural string (e.g. 1165 -> "1165" for "INV/MAIN/1165")
 */
export function formatSequence(seq: number, minPadding = 3): string {
  if (seq < 1000) {
    return String(seq).padStart(minPadding, "0");
  }
  return String(seq);
}

/**
 * Get or determine the starting sequence number based on existing documents.
 */
async function resolveInitialSequence(key: string, fallbackDefault = 1000): Promise<number> {
  try {
    if (key === "INVOICE_SEQUENCE") {
      const docs = await mongoose.connection
        .collection("invoices")
        .find({})
        .sort({ sequenceNumber: -1 })
        .limit(1)
        .toArray();
      if (docs.length > 0 && typeof docs[0].sequenceNumber === "number" && docs[0].sequenceNumber >= 1000) {
        return docs[0].sequenceNumber;
      }
      return 1165; // Matches the official Immigra Link reference invoice INV/MAIN/1165
    }

    if (key === "QUOTATION_SEQUENCE") {
      const docs = await mongoose.connection
        .collection("quotations")
        .find({})
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();
      if (docs.length > 0 && docs[0].quotationNumber) {
        const match = String(docs[0].quotationNumber).match(/(\d+)$/);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
      return 1000;
    }
  } catch (err) {
    // Fall back to safe default
  }

  return fallbackDefault;
}

/**
 * Atomically increments and returns the next sequential number.
 */
export async function getNextSequence(key: string, defaultStart = 1001): Promise<number> {
  let existing = await SequenceModel.findOne({ key });
  if (!existing) {
    const baseNumber = await resolveInitialSequence(key, defaultStart - 1);
    existing = await SequenceModel.findOneAndUpdate(
      { key },
      { $setOnInsert: { sequence: baseNumber } },
      { upsert: true, new: true }
    );
  }

  const result = await SequenceModel.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 } },
    { new: true }
  );

  return result!.sequence;
}

/**
 * Peeks at the next sequential number without incrementing.
 */
export async function peekNextSequence(key: string, defaultStart = 1001): Promise<number> {
  const existing = await SequenceModel.findOne({ key });
  if (!existing) {
    const baseNumber = await resolveInitialSequence(key, defaultStart - 1);
    return baseNumber + 1;
  }
  return existing.sequence + 1;
}
