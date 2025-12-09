import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type TransactionStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED';

export interface TransactionMeta {
  baseAmount: number;
  discount: number;
  travellers: any[];
  paymentGateway: 'RAZORPAY';
}

export interface ITransaction extends Document {
  transactionId: string;
  bookingId: string;
  storyId: string;
  userId: string;

  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  amount: number;
  currency: string;
  status: TransactionStatus;

  meta: TransactionMeta;

  createdAt: Date;
  updatedAt: Date;
}

const TransactionMetaSchema = new Schema<TransactionMeta>(
  {
    baseAmount: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    travellers: { type: Schema.Types.Mixed, required: true, default: [] },
    paymentGateway: {
      type: String,
      enum: ['RAZORPAY'],
      default: 'RAZORPAY',
      required: true,
    },
  },
  { _id: false }
);

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
      required: true,
    },
    bookingId: {
      type: String,
      required: true,
      index: true,
    },
    storyId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
    },
    razorpaySignature: {
      type: String,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
      default: 'INITIATED',
      required: true,
    },

    meta: {
      type: TransactionMetaSchema,
      required: true,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Compound index for efficient queries
TransactionSchema.index({ userId: 1, status: 1 });
TransactionSchema.index({ bookingId: 1, status: 1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
