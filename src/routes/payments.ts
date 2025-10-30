import express from "express";
import { Payments } from "../controllers/payments";

export const payments = (db: any) => {
  const router = express.Router();
  const paymentsController = new Payments(db);

  router.post("/orders", paymentsController.createOrder);
  router.post("/verify", paymentsController.verifyPayment);

  return router;
};
