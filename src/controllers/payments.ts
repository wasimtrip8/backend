import Razorpay from "razorpay";
import crypto from "crypto";
import { Request, Response } from "express";
import { PaymentsStorage } from "../storage/payments";
import { PaymentStatus } from "../models/payments";
import { BookingsStorage } from "../storage/bookings";
import { BookingStatus } from "../models/bookings";
import { Helper } from "../utils/helper";
import { ObjectId } from "mongodb";

export class Payments {
  private razorpay: Razorpay;
  private bookingsStorage: BookingsStorage;
  private paymentsStorage: PaymentsStorage;
  private db: any;

  constructor(db: any) {
    this.db = db;
    this.paymentsStorage = new PaymentsStorage(db);
    this.bookingsStorage = new BookingsStorage(db);

    this.razorpay = new Razorpay({
      key_id: process.env.TEST_RAZORPAY_KEY_ID as string,
      key_secret: process.env.TEST_RAZORPAY_KEY_SECRET as string,
    });
  }

  // ✅ Create Razorpay order
  createOrder = async (req: Request, res: Response) => {
    // Start a client session for transaction
    const session = this.db.client.startSession();

    try {
      const { amount, user_id, trip_id, quotation_id, currency = "INR", receipt } = req.body;

      // Validate required fields
      if (!amount || !user_id || !trip_id || !quotation_id) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: amount, user_id, trip_id, quotation_id"
        });
      }

      // Create Razorpay order first (outside transaction)
      const options = {
        amount: amount * 100, // Razorpay uses paise
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
      };

      const order = await this.razorpay.orders.create(options);

      // Start transaction
      await session.withTransaction(async () => {
        // Create booking
        const booking = await this.bookingsStorage.create({
          user_id: new ObjectId(user_id),
          trip_id: new ObjectId(trip_id),
          quotation_id: new ObjectId(quotation_id),
          booking_id: Helper.generateBookingId(),
          amount,
          status: BookingStatus.CREATED,
        }, session);

        // Create payment with booking reference
        await this.paymentsStorage.create({
          user_id: new ObjectId(user_id),
          booking_id: booking._id,
          razorpay: {
            order_id: order.id,
            payment_id: null,
            signature: null
          },
          amount,
          status: PaymentStatus.CREATED
        }, session);
      });

      // Transaction successful
      res.status(200).json({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.TEST_RAZORPAY_KEY_ID,
      });

    } catch (error) {
      console.error("❌ Error creating Razorpay order:", error);
      res.status(500).json({
        success: false,
        message: "Unable to create Razorpay order",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      // Always end the session
      await session.endSession();
    }
  };

  // ✅ Verify Razorpay payment signature
  verifyPayment = async (req: Request, res: Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      const hmac = crypto.createHmac("sha256", process.env.TEST_RAZORPAY_KEY_SECRET as string);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature === razorpay_signature) {
        await this.paymentsStorage.update(razorpay_order_id, {
          razorpay: {
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            signature: razorpay_signature
          },
          status: PaymentStatus.COMPLETED
        });

        // Update booking status
        await this.bookingsStorage.update(razorpay_order_id, {
          status: BookingStatus.COMPLETED
        });

        console.log("✅ Payment verified:", razorpay_payment_id);
        return res.status(200).json({ success: true, message: "Payment verified successfully" });
      } else {
        console.warn("⚠️ Invalid payment signature");
        return res.status(400).json({ success: false, message: "Invalid payment signature" });
      }
    } catch (error) {
      console.error("❌ Error verifying payment:", error);
      res.status(500).json({ success: false, message: "Payment verification failed" });
    }
  };

  webhook = async (req: Request, res: Response) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET as string;
    const signature = req.headers["x-razorpay-signature"] as string;

    // Verify webhook signature
    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== signature) {
      console.warn("⚠️ Webhook signature mismatch");
      return res.status(400).json({ status: "invalid signature" });
    }

    console.log("✅ Webhook verified:", req.body.event);

    // Respond immediately to Razorpay (important for reliability)
    res.status(200).json({ status: "ok" });

    // Process webhook asynchronously (don't block the response)
    this.processWebhook(req.body).catch(error => {
      console.error("❌ Error processing webhook:", error);
    });
  };

  private processWebhook = async (payload: any) => {
    const event = payload.event;

    try {
      switch (event) {
        case "payment.captured":
          await this.handlePaymentCaptured(payload);
          break;

        case "payment.failed":
          await this.handlePaymentFailed(payload);
          break;

        case "payment.authorized":
          await this.handlePaymentAuthorized(payload);
          break;

        case "refund.created":
          await this.handleRefundCreated(payload);
          break;

        default:
          console.log(`ℹ️ Unhandled webhook event: ${event}`);
      }
    } catch (error) {
      console.error(`❌ Error handling webhook event ${event}:`, error);
      throw error;
    }
  };

  private handlePaymentCaptured = async (payload: any) => {
    const payment = payload.payload.payment.entity;

    try {
      // Check if already processed (idempotency)
      const existingPayment = await this.paymentsStorage.findByOrderId(payment.order_id);
      if (existingPayment?.status === PaymentStatus.SUCCESS) {
        console.log(`⚠️ Payment already processed: ${payment.id}`);
        return;
      }

      // Update payment with complete razorpay details
      await this.paymentsStorage.updateByOrderId(payment.order_id, {
        razorpay: {
          order_id: payment.order_id,
          payment_id: payment.id,
          signature: null // Signature not available in webhook
        },
        status: PaymentStatus.SUCCESS
      });

      // Update booking status
      await this.bookingsStorage.updateByOrderId(payment.order_id, {
        status: BookingStatus.CONFIRMED
      });

      console.log("💰 Payment captured:", payment.id, payment.amount);

      // TODO: Send confirmation email/SMS to user
      // TODO: Trigger any post-payment workflows

    } catch (error) {
      console.error("❌ Error handling payment.captured:", error);
      throw error;
    }
  };

  private handlePaymentFailed = async (payload: any) => {
    const payment = payload.payload.payment.entity;

    try {
      // Update payment status
      await this.paymentsStorage.updateByOrderId(payment.order_id, {
        razorpay: {
          order_id: payment.order_id,
          payment_id: payment.id,
          signature: null
        },
        status: PaymentStatus.FAILED
      });

      // Update booking status
      await this.bookingsStorage.updateByOrderId(payment.order_id, {
        status: BookingStatus.CANCELLED
      });

      console.log("❌ Payment failed:", payment.id, payment.error_description);

      // TODO: Send failure notification to user

    } catch (error) {
      console.error("❌ Error handling payment.failed:", error);
      throw error;
    }
  };

  private handlePaymentAuthorized = async (payload: any) => {
    const payment = payload.payload.payment.entity;

    try {
      // Payment authorized but not yet captured (for manual capture flow)
      await this.paymentsStorage.updateByOrderId(payment.order_id, {
        razorpay: {
          order_id: payment.order_id,
          payment_id: payment.id,
          signature: null
        },
        status: PaymentStatus.AUTHORIZED
      });

      console.log("✅ Payment authorized:", payment.id);

    } catch (error) {
      console.error("❌ Error handling payment.authorized:", error);
      throw error;
    }
  };

  private handleRefundCreated = async (payload: any) => {
    const refund = payload.payload.refund.entity;

    try {
      // Find payment by payment_id
      const payment = await this.paymentsStorage.findByPaymentId(refund.payment_id);

      if (payment) {
        await this.paymentsStorage.updateByOrderId(payment.razorpay?.order_id!, {
          status: PaymentStatus.REFUNDED
        });

        // Update booking status
        await this.bookingsStorage.updateByOrderId(payment.razorpay?.order_id!, {
          status: BookingStatus.CANCELLED
        });

        console.log("💸 Refund created:", refund.id, refund.amount);

        // TODO: Send refund confirmation to user
      }

    } catch (error) {
      console.error("❌ Error handling refund.created:", error);
      throw error;
    }
  };
}