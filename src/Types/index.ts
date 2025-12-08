import { Document } from 'mongoose';

// Role Master Types
export interface IRole extends Document {
  roleId: string;
  roleName: string;
  roleStatus: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

// Auth User Types
export interface IAuthUser extends Document {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string; // Optional phone number for travellers
  password?: string; // Optional since hosts may not have password initially
  role: string;
  isActive: boolean;
  firebaseUid?: string; // Firebase User ID
  blockReason?: string | null; // Reason for blocking the user
  createdAt: Date;
  updatedAt: Date;
}

// Host Profile Types
export interface IHostProfile extends Document {
  hostId: string;
  userId: string; // References AuthUser
  age?: number;
  gender?: string;
  mobileNumber?: string;
  nationality?: string;
  location?: string;
  aadharNumber?: string;
  aadharDocs?: string[]; // Array of S3 URLs
  pccCertificateUrl?: string; // S3 URL
  livePicUrl?: string; // S3 URL
  otp?: string | null; // OTP for email verification
  otpTimestamp?: number | null; // Timestamp when OTP was sent
  isEmailVerified?: boolean; // Flag to track email verification
  onboardingStep: 1 | 2 | 3;
  isOnboardingComplete: boolean;
  status: 'PENDING' | 'APPROVED' | 'BLOCKED' | 'REJECTED';
  blockReason?: string | null; // Reason for blocking the host
  rejectReason?: string | null; // Reason for rejecting the host
  rejectedAt?: Date | null; // Timestamp when host was rejected
  createdAt: Date;
  updatedAt: Date;
}

// Request Types
export interface RegisterUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

export interface RegisterHostStep1Request {
  fullName: string;
  email: string;
  age: number;
  gender: string;
  mobileNumber: string;
  nationality: string;
  role: string;
}

export interface RegisterHostStep2Request {
  password: string;
}

export interface RegisterHostStep3Request {
  location: string;
  aadharNumber: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

// Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginResponse {
  user: {
    userId: string;
    fullName: string;
    email: string;
    role: string;
    firebaseUid?: string;
  };
  token: string;
  firebaseToken?: string;
  // New fields for token management
  accessToken?: string;
  refreshToken?: string;
}

export interface GoogleLoginResponse {
  user: {
    userId: string;
    fullName: string;
    email: string;
    role: string;
    firebaseUid: string;
  };
  token: string;
  firebaseToken: string;
  // New fields for token management
  accessToken?: string;
  refreshToken?: string;
}

export interface HostStepResponse {
  hostId: string;
  userId: string;
  onboardingStep: number;
  isOnboardingComplete: boolean;
  message: string;
  token?: string; // Optional token for step 3 completion
  user?: {
    userId: string;
    fullName: string;
    email: string;
    role: string;
  };
}

// Firebase Types
export interface FirebaseUser {
  uid: string;
  email?: string | undefined;
  name?: string | undefined;
  picture?: string | undefined;
  email_verified?: boolean | undefined;
}

// Extend Express Request type to include Firebase user
declare global {
  namespace Express {
    interface Request {
      user?: FirebaseUser;
    }
  }
}
