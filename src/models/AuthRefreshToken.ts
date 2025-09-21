import mongoose, { Schema, Document, Types } from "mongoose";
import { ProviderType, TokenStatusType } from "./Enums";

export interface IAuthRefreshToken extends Document {
  user_id: Types.ObjectId;
  platform_id: Types.ObjectId;
  refresh_token: string;
  expires_at: Date;
  device_id?: string;
  ip_address?: string;
  provider: ProviderType;
  status: TokenStatusType;
  created_at: Date;
  modified_at: Date;
}

const AuthRefreshTokenSchema: Schema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, index: true },
    platform_id: { type: Schema.Types.ObjectId, required: true, index: true },
    refresh_token: { type: String, maxlength: 128, required: true },
    expires_at: { type: Date, required: true },
    device_id: { type: String, maxlength: 128 },
    ip_address: { type: String, maxlength: 40 },
    provider: { type: String, enum: Object.values(ProviderType), required: true },
    status: { type: String, enum: Object.values(TokenStatusType), required: true },
  },
  { collection: "auth_refresh_tokens", timestamps: true }
);

export default mongoose.model<IAuthRefreshToken>("AuthRefreshToken", AuthRefreshTokenSchema);