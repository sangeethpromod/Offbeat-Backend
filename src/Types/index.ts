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
  password?: string; // Optional since hosts may not have password initially
  role: string;
  isActive: boolean;
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
  onboardingStep: 1 | 2 | 3;
  isOnboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Request Types
export interface RegisterTravellerRequest {
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
  };
  token: string;
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
