import { ObjectId } from "mongodb";
import { TokenStatus, VerificationType } from "../types/enum";

export interface IVerificationToken {
  _id?: ObjectId;
  platform_id: ObjectId;
  user_id?: ObjectId | null;
  verification_type: VerificationType;
  token: string;
  code?: string;
  link?: string | null;
  verify_attempts?: number;
  resend_attempts?: number;
  expires_at: Date;
  status: TokenStatus;
  created_at?: Date;
  modified_at?: Date;
}
