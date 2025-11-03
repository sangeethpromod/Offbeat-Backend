import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  tokenId: string; // jti
  userId: string;
  tokenHash: string; // bcrypt hash of the refresh token
  expiresAt: Date;
  revoked: boolean;
  replacedByTokenId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    revoked: { type: Boolean, default: false },
    replacedByTokenId: { type: String },
  },
  { timestamps: true }
);

RefreshTokenSchema.index({ userId: 1, tokenId: 1 });

export default mongoose.model<IRefreshToken>(
  'RefreshToken',
  RefreshTokenSchema
);
