import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type LocationType =
  | 'Pickup and Dropoff'
  | 'Pickup Only'
  | 'Drop Only'
  | 'None';

export type PricingType = 'Per Day' | 'Per Person';

export interface PriceItem {
  label: string;
  value: number;
}

export interface IStory extends Document {
  storyId: string;
  // Step 1
  storyTitle: string;
  storyDescription: string;
  state: string;
  location: string;
  startDate: Date;
  endDate: Date;
  noOfDays: number;
  maxTravelersPerDay: number;
  status: 'DRAFT' | 'INCOMPLETE' | 'PUBLISHED';
  // Step 2
  locationType?: LocationType;
  pickupLocation?: string;
  pickupGoogleMapLink?: string;
  dropOffLocation?: string;
  dropOffGoogleMapLink?: string;
  hostName?: string;
  hostDescription?: string;
  // Step 3
  pricingType?: PricingType;
  amount?: number;
  discount?: number;
  platformFee?: number;
  totalPrice?: number;
  priceBreakdown?: PriceItem[];
  createdAt: Date;
  updatedAt: Date;
}

const PriceItemSchema = new Schema<PriceItem>(
  {
    label: { type: String, required: true, trim: true },
    value: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const StorySchema = new Schema<IStory>(
  {
    storyId: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    // Step 1
    storyTitle: { type: String, required: true, trim: true },
    storyDescription: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    noOfDays: { type: Number, required: true, min: 1 },
    maxTravelersPerDay: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['DRAFT', 'INCOMPLETE', 'PUBLISHED'],
      default: 'DRAFT',
      required: true,
    },
    // Step 2
    locationType: {
      type: String,
      enum: ['Pickup and Dropoff', 'Pickup Only', 'Drop Only', 'None'],
    },
    pickupLocation: { type: String, trim: true },
    pickupGoogleMapLink: { type: String, trim: true },
    dropOffLocation: { type: String, trim: true },
    dropOffGoogleMapLink: { type: String, trim: true },
    hostName: { type: String, trim: true },
    hostDescription: { type: String, trim: true },
    // Step 3
    pricingType: { type: String, enum: ['Per Day', 'Per Person'] },
    amount: { type: Number, min: 0 },
    discount: { type: Number, min: 0 },
    platformFee: { type: Number, default: 50, min: 0 },
    totalPrice: { type: Number, min: 0 },
    priceBreakdown: { type: [PriceItemSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IStory>('Story', StorySchema);
