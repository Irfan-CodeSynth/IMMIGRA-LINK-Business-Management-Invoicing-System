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

export async function getNextSequence(key: string, defaultStart = 1001): Promise<number> {
  const result = await SequenceModel.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return result.sequence;
}
