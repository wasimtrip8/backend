import { ObjectId } from "mongodb";

export enum QuotationStatus {
  REQUESTED = "REQUESTED",
  QUOTE_IN_PROGRESS = "QUOTE_IN_PROGRESS",
  QUOTED = "QUOTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export interface IQuotation {
  _id?: ObjectId;
  creator?: ObjectId;
  user_id?: ObjectId;
  trip_id?: ObjectId;
  vendor_id?: ObjectId;
  car?: Record<string, any>;
  stay?: Record<string, any>;
  price?: number;
  expires_at?: Date;
  status?: QuotationStatus;
  is_deleted?: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  modified_at: Date;
}
