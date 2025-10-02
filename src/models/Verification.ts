import { ObjectId } from "mongodb";
import { TokenStatus } from "../types/enum";
import { IVerificationToken } from "./verificationToken";

export interface IVerification {
  _id?: ObjectId;
  mobile_email: string;
  tokens: IVerificationToken[];
  status: TokenStatus;
  created_at?: Date;
  modified_at?: Date;
}