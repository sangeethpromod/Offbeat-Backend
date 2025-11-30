import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type LocationType =
  | 'Pickup and Dropoff'
  | 'Pickup Only'
  | 'Drop Only'
  | 'None';

export type PricingType = 'Per Day' | 'Per Person';

export type AvailabilityType = 'YEAR_ROUND' | 'TRAVEL_WITH_STARS';

export interface ImageData {
  key: string;
  url: string;
}

export interface Activity {
  type: string;
  activityName: string;
  activityDescription?: string;
  activityTime?: string;
  activityDuration?: string;
  activityLocation?: string;
}

export interface ItineraryDay {
  day: number;
  activities: Activity[];
}

export interface StoryImages {
  bannerImage?: ImageData;
  storyImage?: ImageData;
  otherImages?: ImageData[];
}

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
  tags: string[]; // Array of tags, min 4, max 6
  availabilityType: AvailabilityType; // YEAR_ROUND or TRAVEL_WITH_STARS
  // For YEAR_ROUND availability
  storyLength?: number; // Duration in days (required for YEAR_ROUND)
  maxTravelersPerDay?: number; // (required for YEAR_ROUND)
  // For TRAVEL_WITH_STARS availability
  startDate?: Date; // (required for TRAVEL_WITH_STARS)
  endDate?: Date; // (required for TRAVEL_WITH_STARS)
  maxTravellersScheduled?: number; // (required for TRAVEL_WITH_STARS)
  status:
    | 'DRAFT'
    | 'STEP 1 COMPLETED'
    | 'STEP 2 COMPLETED'
    | 'STEP 3 COMPLETED'
    | 'STEP 4 COMPLETED'
    | 'STEP 5 COMPLETED'
    | 'PUBLISHED'
    | 'APPROVED';
  createdBy: string; // Added: User ID of the creator
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
  // Step 4
  storyImages?: StoryImages;
  pickUpTime?: Date;
  dropOffTime?: Date;
  itinerary?: ItineraryDay[];
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

const ImageDataSchema = new Schema<ImageData>(
  {
    key: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ActivitySchema = new Schema<Activity>(
  {
    type: { type: String, required: true, trim: true },
    activityName: { type: String, required: true, trim: true },
    activityDescription: { type: String, trim: true },
    activityTime: { type: String, trim: true },
    activityDuration: { type: String, trim: true },
    activityLocation: { type: String, trim: true },
  },
  { _id: false }
);

const ItineraryDaySchema = new Schema<ItineraryDay>(
  {
    day: { type: Number, required: true, min: 1 },
    activities: { type: [ActivitySchema], default: [] },
  },
  { _id: false }
);

const StoryImagesSchema = new Schema<StoryImages>(
  {
    bannerImage: ImageDataSchema,
    storyImage: ImageDataSchema,
    otherImages: [ImageDataSchema],
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
    tags: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr: string[]) {
          return arr.length >= 4 && arr.length <= 6;
        },
        message: 'Tags must contain between 4 and 6 items',
      },
    },
    availabilityType: {
      type: String,
      enum: ['YEAR_ROUND', 'TRAVEL_WITH_STARS'],
      required: true,
    },
    // For YEAR_ROUND availability
    storyLength: { type: Number, min: 1 },
    maxTravelersPerDay: { type: Number, min: 1 },
    // For TRAVEL_WITH_STARS availability
    startDate: { type: Date },
    endDate: { type: Date },
    maxTravellersScheduled: { type: Number, min: 1 },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'STEP 1 COMPLETED',
        'STEP 2 COMPLETED',
        'STEP 3 COMPLETED',
        'STEP 4 COMPLETED',
        'STEP 5 COMPLETED',
        'PUBLISHED',
        'APPROVED',
      ],
      default: 'DRAFT',
      required: true,
    },
    createdBy: { type: String, required: true, trim: true }, // Added: User ID of the creator
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
    // Step 4
    storyImages: StoryImagesSchema,
    pickUpTime: { type: Date },
    dropOffTime: { type: Date },
    itinerary: { type: [ItineraryDaySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IStory>('Story', StorySchema);
