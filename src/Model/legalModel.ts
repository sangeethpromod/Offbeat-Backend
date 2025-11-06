import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ILegal extends Document {
  legalId: string;
  legalName: string;
  legalDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

const LegalSchema = new Schema<ILegal>(
  {
    legalId: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    legalName: {
      type: String,
      required: true,
      trim: true,
    },
    legalDescription: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ILegal>('Legal', LegalSchema);
