import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IAuthUser } from '../Types';

/**
 * AuthUser Schema for MongoDB
 *
 * This schema defines the common authentication data for all users in the system.
 * It supports both travellers (complete registration) and hosts (partial initial registration).
 */
const AuthUserSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      // Not required initially for hosts - they set password in step 2
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Note: email and userId indexes are automatically created due to unique: true
// No need for explicit index creation to avoid duplicate warnings

/**
 * AuthUser Model
 *
 * Mongoose model for user authentication data. This model handles:
 * - User identification and contact information
 * - Authentication credentials (password may be null for incomplete hosts)
 * - Role-based access control
 * - Account status tracking
 */
export default mongoose.model<IAuthUser>('AuthUser', AuthUserSchema);
