import mongoose, { Schema, Document } from 'mongoose';
import { generateFeeId } from '../Utils/feeIdGenerator';

export interface IFeeStructure extends Document {
  feeName: string;
  feeId: string;
  feeAmount: number;
}

const FeeStructureSchema: Schema = new Schema(
  {
    feeName: { type: String, required: true },
    feeId: { type: String, required: true, unique: true },
    feeAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

// Auto-generate feeId like "ofb-feestrcut-001" if not provided
FeeStructureSchema.pre<IFeeStructure>('validate', async function (next) {
  try {
    if (!this.feeId) {
      this.feeId = await generateFeeId();
    }
    next();
  } catch (err) {
    next(err as any);
  }
});

export const FeeStructure = mongoose.model<IFeeStructure>(
  'FeeStructure',
  FeeStructureSchema
);
