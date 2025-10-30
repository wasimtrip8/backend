import { ObjectId } from "mongodb";

export enum PaymentMode {
  RAZORPAY = "RAZORPAY",
  UPI = "UPI",
  CASH = "CASH",
  OTHER = "OTHER",
}

export enum PaymentStatus {
  CREATED = "CREATED",
  CAPTURED = "CAPTURED",
  PAID = "PAID",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  REFUNDED = "REFUNDED",
  AUTHORIZED = "AUTHORIZED",
  SUCCESS = "SUCCESS"
}

export interface IRazorpayDetails {
  order_id?: string | null;
  payment_id?: string | null;
  signature?: string | null;
}

export interface IPayment {
  _id?: ObjectId;
  user_id: ObjectId;
  booking_id: ObjectId;
  creator?: ObjectId; // mostly for admins
  amount: number;
  razorpay?: IRazorpayDetails | null;
  partial?: boolean; // if partially paid
  mode?: PaymentMode;
  status?: PaymentStatus;
  created_at?: Date;
  modified_at?: Date;
}

export enum RefundStatus {
  APPROVED = "APPROVED",
  REFUNDED = "REFUNDED",
}

export interface IRazorpayRefundDetails {
  refund_id?: string | null;
  payment_id?: string | null;
  order_id?: string | null;
  amount?: number;
}

export interface IPaymentRefund {
  _id?: ObjectId;
  user_id: ObjectId;
  booking_id: ObjectId;
  payment_id: ObjectId;
  creator?: ObjectId;
  amount: number; // refund amount
  razorpay?: IRazorpayRefundDetails | null;
  status?: RefundStatus;
  created_at?: Date;
  modified_at?: Date;
}
