import { ObjectId } from "mongodb";

export enum BookingPaymentStatus {
  PENDING = "PENDING",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  FULLY_PAID = "FULLY_PAID",
  REFUNDED = "REFUNDED",
}

export enum BookingStatus {
  CREATED = "CREATED",
  RESERVED = "RESERVED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface IBooking {
  _id?: ObjectId;
  user_id?: ObjectId;
  quotation_id?: ObjectId;
  trip_id?: ObjectId;
  booking_id: string; // human-readable booking identifier
  creator?: ObjectId; // admin or user who created
  amount?: number;
  tax_percentage?: number; // usually 18
  tax_amount?: number;
  coupon_id?: ObjectId | null;
  coupon_code?: string | null;
  coupon_discount?: number; // 0 if none
  discount?: number; // total discount
  additional_discount?: number; // any extra manual discount
  total_amount?: number;
  final_amount?: number; // rounded final amount
  payment_status?: BookingPaymentStatus;
  pending_payment?: number;
  status?: BookingStatus;
  created_at?: Date;
  modified_at?: Date;
}
