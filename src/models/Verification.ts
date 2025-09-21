import mongoose, { Schema, Document, Types } from "mongoose";
import { TokenStatusType } from "./Enums";
import { IVerificationToken, VerificationTokenSchema } from "./VerificationToken";

export interface IVerification extends Document {
  mobile_email: string;
  tokens: Types.DocumentArray<IVerificationToken>;
  status: TokenStatusType;
  created_at: Date;
  modified_at: Date;
}

const VerificationSchema: Schema = new Schema(
  {
    mobile_email: { type: String, maxlength: 100, required: true, unique: true, index: true },
    tokens: { type: [VerificationTokenSchema], default: [] },
    status: { type: String, enum: Object.values(TokenStatusType), required: true },
  },
  { collection: "verification", timestamps: true }
);

export default mongoose.model<IVerification>("Verification", VerificationSchema);