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

// Helper function to create a new verification token object
export function createVerificationToken(params: Partial<IVerificationToken>): IVerificationToken {
  const now = new Date();
  return {
    platform_id: params.platform_id!,
    user_id: params.user_id || null,
    verification_type: params.verification_type!,
    token: params.token || "",
    code: params.code || "0",
    link: params.link || null,
    verify_attempts: params.verify_attempts || 0,
    resend_attempts: params.resend_attempts || 0,
    expires_at: params.expires_at || new Date(now.getTime() + 5 * 60 * 1000), // default 5 min
    status: params.status || TokenStatus.ACTIVE,
    created_at: now,
    modified_at: now,
  };
}

// Example usage with native MongoDB driver:
// const db = getDb(); // your MongoDB database instance
// const verificationTokens = db.collection<IVerificationToken>("verification_tokens");
// const token = createVerificationToken({ platform_id, verification_type, token: "123456" });
// await verificationTokens.insertOne(token);
