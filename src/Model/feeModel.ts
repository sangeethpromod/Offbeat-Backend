import mongoose, { Schema, Document } from 'mongoose';
import { generateFeeId } from '../Utils/feeIdGenerator';

export interface IFeeStructure extends Document {
  feeName: string;
  feeId: string;
  feeType: 'FLAT' | 'PERCENTAGE' | 'COMMISSION';
  value: number; // fee amount or percentage
  appliesTo: 'TRAVELLER' | 'HOST' | 'BOTH';
  scope: 'GLOBAL' | 'STORY'; // STORY means it applies to story bookings
  isActive: boolean;
}

const FeeStructureSchema = new Schema(
  {
    feeName: { type: String, required: true },
    feeId: { type: String, unique: true },
    feeType: {
      type: String,
      enum: ['FLAT', 'PERCENTAGE', 'COMMISSION'],
      required: true,
    },
    value: { type: Number, required: true },
    appliesTo: {
      type: String,
      enum: ['TRAVELLER', 'HOST', 'BOTH'],
      required: true,
    },
    scope: {
      type: String,
      enum: ['GLOBAL', 'STORY'],
      default: 'GLOBAL',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Pre-save hook to generate feeId if not provided
FeeStructureSchema.pre('save', async function (next) {
  if (!this.feeId) {
    this.feeId = await generateFeeId();
  }
  next();
});

export default mongoose.model<IFeeStructure>(
  'FeeStructure',
  FeeStructureSchema
);
