import mongoose, { Schema, Document, Types } from "mongoose";
import { UserRole, StatusType } from "./Enums";

export interface IUser extends Document {
  creator?: Types.ObjectId;
  name: string;
  mobile: string;
  mobile_verified: boolean;
  email: string;
  email_verified: boolean;
  password: string;
  google_id?: string;
  is_verified: boolean;
  picture?: string;
  role: UserRole;
  status: StatusType;
  is_deleted: boolean;
  deleted_at?: Date;
  created_at: Date;
  modified_at: Date;
}

const UserSchema: Schema = new Schema(
  {
    creator: { type: Schema.Types.ObjectId, default: null },
    name: { type: String, required: true, unique: true, maxlength: 50, index: true },
    mobile: { type: String, required: true, unique: true, maxlength: 10, index: true },
    mobile_verified: { type: Boolean, default: false },
    email: { type: String, required: true, unique: true, maxlength: 100, index: true },
    email_verified: { type: Boolean, default: false },
    password: { type: String, required: true },
    google_id: { type: String, maxlength: 255, default: null },
    is_verified: { type: Boolean, default: false },
    picture: { type: String, maxlength: 255 },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    status: { type: String, enum: Object.values(StatusType), default: StatusType.ACTIVE },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);