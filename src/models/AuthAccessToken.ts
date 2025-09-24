import mongoose, { Schema, Document, Types } from "mongoose";
import { ProviderType, TokenStatusType } from "../types/enum";

export interface IAuthAccessToken extends Document {
  user_id: Types.ObjectId;
  refresh_id: Types.ObjectId;
  access_token: string;
  device_id?: string;
  device_token?: string;
  expires_at: Date;
  ip_address?: string;
  provider: ProviderType;
  status: TokenStatusType;
  created_at: Date;
  modified_at: Date;
}

const AuthAccessTokenSchema: Schema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, index: true },
    refresh_id: { type: Schema.Types.ObjectId, required: true, index: true },
    access_token: { type: String, maxlength: 128, required: true },
    device_id: { type: String, maxlength: 128 },
    device_token: { type: String, maxlength: 250 },
    expires_at: { type: Date, required: true },
    ip_address: { type: String, maxlength: 40 },
    provider: { type: String, enum: Object.values(ProviderType), required: true },
    status: { type: String, enum: Object.values(TokenStatusType), required: true },
  },
  { collection: "auth_access_tokens", timestamps: true }
);

export default mongoose.model<IAuthAccessToken>("AuthAccessToken", AuthAccessTokenSchema);