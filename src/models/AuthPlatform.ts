import mongoose, { Schema, Document } from "mongoose";
import { PlatformType, StatusType } from "./Enums";

export interface IAuthPlatform extends Document {
  name: string;
  app_id?: string;
  app_secret?: string;
  identifier?: string;
  platform: PlatformType;
  status: StatusType;
  is_deleted: boolean;
  deleted_at?: Date;
  created_at: Date;
  modified_at: Date;
}

const AuthPlatformSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, maxlength: 50, index: true },
    app_id: { type: String, maxlength: 80 },
    app_secret: { type: String, maxlength: 128 },
    identifier: { type: String, maxlength: 100 },
    platform: { type: String, enum: Object.values(PlatformType), required: true },
    status: { type: String, enum: Object.values(StatusType), required: true },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  { collection: "auth_platforms", timestamps: true }
);

export default mongoose.model<IAuthPlatform>("AuthPlatform", AuthPlatformSchema);
