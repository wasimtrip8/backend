import mongoose, { Schema, Document, Types } from "mongoose";
import { TokenStatusType, VerificationType } from "../types/enum";

export interface IVerificationToken extends Document {
  platform_id: Types.ObjectId;
  user_id?: Types.ObjectId;
  verification_type: VerificationType;
  token: string;
  code?: string;
  link?: string;
  verify_attempts?: number;
  resend_attempts?: number;
  expires_at: Date;
  status: TokenStatusType;
  created_at: Date;
  modified_at: Date;
}

export const VerificationTokenSchema: Schema = new Schema(
  {
    platform_id: { type: Schema.Types.ObjectId, required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, default: null, index: true },
    verification_type: { type: String, enum: Object.values(VerificationType), required: true },
    token: { type: String, maxlength: 128, required: true },
    code: { type: String, maxlength: 6, default: "0" },
    link: { type: String, maxlength: 255, default: null, index: true },
    verify_attempts: { type: Number, default: 0 },
    resend_attempts: { type: Number, default: 0 },
    expires_at: { type: Date, required: true },
    status: { type: String, enum: Object.values(TokenStatusType), required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IVerificationToken>("VerificationToken", VerificationTokenSchema);