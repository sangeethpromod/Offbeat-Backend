import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type TransactionStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED';

export interface TransactionMeta {
  paymentGateway: 'RAZORPAY';
}

export interface PaymentDetails {
  method?: string; // UPI, Card, NetBanking, etc.
  bankRRN?: string; // Bank Reference Number
  invoiceId?: string; // Razorpay Invoice ID
  payerAccountType?: string; // Account type used for payment
  vpa?: string; // UPI VPA (Virtual Payment Address)
  cardNetwork?: string; // Visa, Mastercard, etc.
  cardLast4?: string; // Last 4 digits of card
  bank?: string; // Bank name
  wallet?: string; // Wallet name if wallet payment
}

export interface FeeDetails {
  totalFee?: number; // Total fee charged by Razorpay (in paise)
  razorpayFee?: number; // Razorpay's fee (in paise)
  gst?: number; // GST on the fee (in paise)
  serviceTax?: number; // Service tax if applicable (in paise)
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

  paymentDetails?: PaymentDetails; // Detailed payment information
  feeDetails?: FeeDetails; // Fee breakdown

  meta: TransactionMeta;

  createdAt: Date;
  updatedAt: Date;
}

const TransactionMetaSchema = new Schema<TransactionMeta>(
  {
    paymentGateway: {
      type: String,
      enum: ['RAZORPAY'],
      default: 'RAZORPAY',
      required: true,
    },
  },
  { _id: false }
);

const PaymentDetailsSchema = new Schema<PaymentDetails>(
  {
    method: { type: String },
    bankRRN: { type: String },
    invoiceId: { type: String },
    payerAccountType: { type: String },
    vpa: { type: String },
    cardNetwork: { type: String },
    cardLast4: { type: String },
    bank: { type: String },
    wallet: { type: String },
  },
  { _id: false }
);

const FeeDetailsSchema = new Schema<FeeDetails>(
  {
    totalFee: { type: Number },
    razorpayFee: { type: Number },
    gst: { type: Number },
    serviceTax: { type: Number },
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

    paymentDetails: {
      type: PaymentDetailsSchema,
      required: false,
    },

    feeDetails: {
      type: FeeDetailsSchema,
      required: false,
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
