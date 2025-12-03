import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IHostProfile } from '../Types';

/**
 * HostProfile Schema for MongoDB
 *
 * This schema defines host-specific profile data and tracks the multi-step onboarding process.
 * It stores additional information required only for hosts, including document URLs and onboarding progress.
 */
const HostProfileSchema: Schema = new Schema(
  {
    hostId: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      ref: 'AuthUser',
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      trim: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
    },
    nationality: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    aadharNumber: {
      type: String,
      trim: true,
    },
    aadharDocs: [
      {
        type: String, // Array of S3 URLs
      },
    ],
    pccCertificateUrl: {
      type: String, // S3 URL
    },
    livePicUrl: {
      type: String, // S3 URL
    },
    otp: {
      type: String,
      default: null,
    },
    otpTimestamp: {
      type: Number,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    onboardingStep: {
      type: Number,
      enum: [1, 2, 3],
      default: 1,
    },
    isOnboardingComplete: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'BLOCKED', 'REJECTED'],
      default: 'PENDING',
    },
    blockReason: {
      type: String,
      trim: true,
      default: null,
    },
    rejectReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Note: hostId index is automatically created due to unique: true
// Only add userId index since it's not unique but frequently queried
HostProfileSchema.index({ userId: 1 });

/**
 * HostProfile Model
 *
 * Mongoose model for host-specific profile data and onboarding tracking. This model handles:
 * - Host personal information (age, gender, nationality, etc.)
 * - Document storage (Aadhar, PCC certificate, live picture) via S3 URLs
 * - Multi-step onboarding progress tracking
 * - Location and contact information
 */
export default mongoose.model<IHostProfile>('HostProfile', HostProfileSchema);
