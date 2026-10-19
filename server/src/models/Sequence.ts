import mongoose, { Schema, Document } from "mongoose";

export interface ISequenceDocument extends Document {
  key: string;
  sequence: number;
}

const SequenceSchema = new Schema<ISequenceDocument>({
  key: { type: String, required: true, unique: true },
  sequence: { type: Number, required: true, default: 0 },
});

export const SequenceModel = mongoose.model<ISequenceDocument>("Sequence", SequenceSchema);

/**
 * Format a sequence number with 3-digit padding:
 * 1 -> "001" (e.g. INV-001)
 * 2 -> "002" (e.g. INV-002)
 * 3 -> "003" (e.g. INV-003)
 * 1000 -> "1000"
 */
export function formatSequence(seq: number, minPadding = 3): string {
  if (seq < 1000) {
    return String(seq).padStart(minPadding, "0");
  }
  return String(seq);
}

/**
 * Atomically increments and returns the next sequential number starting from 1.
 */
export async function getNextSequence(key: string, defaultStart = 1): Promise<number> {
  const baseDefault = Math.max(0, defaultStart - 1);

  await SequenceModel.findOneAndUpdate(
    { key },
    { $setOnInsert: { sequence: baseDefault } },
    { upsert: true, new: true }
  );

  const result = await SequenceModel.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 } },
    { new: true }
  );

  return result!.sequence;
}

/**
 * Peeks at the next sequential number without incrementing (default start: 1).
 */
export async function peekNextSequence(key: string, defaultStart = 1): Promise<number> {
  const existing = await SequenceModel.findOne({ key });
  if (!existing) {
    return defaultStart;
  }
  return existing.sequence + 1;
}
