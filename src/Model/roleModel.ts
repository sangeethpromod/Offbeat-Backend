import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IRole extends Document {
  roleId: string;
  roleName: string;
  roleStatus: string;
}

const RoleSchema: Schema = new Schema(
  {
    roleId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },
    roleName: {
      type: String,
      required: true,
      trim: true,
    },
    roleStatus: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IRole>('Role', RoleSchema);
