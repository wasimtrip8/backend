import { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

export class Payments {
  private razorpay: Razorpay;

  constructor(private db: any) {
    this.razorpay = new Razorpay({
      key_id: process.env.TEST_RAZORPAY_KEY_ID as string,
      key_secret: process.env.TEST_RAZORPAY_KEY_SECRET as string,
    });
  }

  // ✅ Create Razorpay order
  createOrder = async (req: Request, res: Response) => {
    try {
      const { amount, currency = "INR", receipt } = req.body;

      const options = {
        amount: amount * 100, // Razorpay uses paise
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
      };

      const order = await this.razorpay.orders.create(options);

      res.status(200).json({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error("❌ Error creating Razorpay order:", error);
      res.status(500).json({ success: false, message: "Unable to create Razorpay order" });
    }
  };

  // ✅ Verify Razorpay payment signature
  verifyPayment = async (req: Request, res: Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature === razorpay_signature) {
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

    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest === signature) {
      console.log("✅ Webhook verified:", req.body.event);

      // handle specific event types
      if (req.body.event === "payment.captured") {
        const payment = req.body.payload.payment.entity;
        // save payment info in DB
        console.log("💰 Payment captured:", payment.id, payment.amount);
      }

      res.status(200).json({ status: "ok" });
    } else {
      console.warn("⚠️ Webhook signature mismatch");
      res.status(400).json({ status: "invalid signature" });
    }
  };
}