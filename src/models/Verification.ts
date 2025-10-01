import { ObjectId } from "mongodb";
import { TokenStatus } from "../types/enum";
import { IVerificationToken } from "./VerificationToken";

export interface IVerification {
  _id?: ObjectId;
  mobile_email: string;
  tokens: IVerificationToken[];
  status: TokenStatus;
  created_at?: Date;
  modified_at?: Date;
}

// Helper function to create a new verification object
export function createVerification(params: Partial<IVerification>): IVerification {
  const now = new Date();
  return {
    mobile_email: params.mobile_email!,
    tokens: params.tokens || [],
    status: params.status || TokenStatus.ACTIVE,
    created_at: now,
    modified_at: now,
  };
}

// Example usage with native MongoDB driver:
// const db = getDb(); // your MongoDB database instance
// const verificationCollection = db.collection<IVerification>("verification");
// const verification = createVerification({ mobile_email: "user@example.com" });
// await verificationCollection.insertOne(verification);
