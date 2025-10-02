import { ObjectId } from "mongodb";
import { UserRole, StatusType } from "../types/enum";

export interface IUser {
  _id?: ObjectId;
  creator?: ObjectId | null;
  name: string;
  mobile?: string;
  mobile_verified: boolean;
  email?: string;
  email_verified: boolean;
  google_id?: string | null;
  is_verified: boolean;
  picture?: string;
  role: UserRole;
  status: StatusType;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at?: Date;
  modified_at?: Date;
  source?: string;
}
