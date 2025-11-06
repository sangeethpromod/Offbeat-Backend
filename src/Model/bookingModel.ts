import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface Traveller {
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
}

export interface PaymentDetail {
  totalBase: number;
  platformFee: number;
  discount: number;
  totalPayment: number;
}

export interface IBooking extends Document {
  bookingId: string;
  storyId: string; // Story UUID from Story.storyId
  userId: string; // User ID of the person who made the booking
  startDate: Date;
  endDate: Date;
  noOfTravellers: number;
  travellers: Traveller[];
  paymentDetails: PaymentDetail[];
  status: 'confirmed' | 'cancelled';
  totalTravellers: number; // Virtual field (same as noOfTravellers)
  createdAt: Date;
  updatedAt: Date;
}

const TravellerSchema = new Schema<Traveller>(
  {
    fullName: { type: String, required: true, trim: true },
    emailAddress: { type: String, required: true, trim: true, lowercase: true },
    phoneNumber: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const PaymentDetailSchema = new Schema<PaymentDetail>(
  {
    totalBase: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, default: 50, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalPayment: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const BookingSchema = new Schema<IBooking>(
  {
    bookingId: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    storyId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    noOfTravellers: { type: Number, required: true, min: 1 },
    travellers: {
      type: [TravellerSchema],
      required: true,
      validate: {
        validator: function (arr: Traveller[]) {
          return arr.length > 0;
        },
        message: 'At least one traveller is required',
      },
    },
    paymentDetails: {
      type: [PaymentDetailSchema],
      required: true,
      validate: {
        validator: function (arr: PaymentDetail[]) {
          return arr.length > 0;
        },
        message: 'At least one payment detail is required',
      },
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
      required: true,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Compound index for efficient date range queries
BookingSchema.index({ storyId: 1, startDate: 1, endDate: 1 });

// Virtual for totalTravellers
BookingSchema.virtual('totalTravellers').get(function (this: IBooking) {
  return this.noOfTravellers;
});

// Ensure virtual fields are serialized
BookingSchema.set('toJSON', { virtuals: true });
BookingSchema.set('toObject', { virtuals: true });

// Pre-save validation to ensure endDate >= startDate
BookingSchema.pre('save', function (next) {
  if (this.endDate < this.startDate) {
    next(new Error('endDate must be greater than or equal to startDate'));
  }
  next();
});

export default mongoose.model<IBooking>('Booking', BookingSchema);
