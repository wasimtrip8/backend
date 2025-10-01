import express from "express";
import { validate } from "../middlewares/validate";
import { Auth } from "../controllers/auth";
import { refreshValidator, sendOtpValidator, verifyOtpValidator, resendOtpValidator, otpLoginValidator } from "../validators/authValidator";

export const auth = (db: any) => {
  const router = express.Router();
  const authController = new Auth(db);

  router.post("/refresh", refreshValidator, validate, authController.refresh);
  router.post("/otp/send", sendOtpValidator, validate, authController.sendOtp);
  router.post("/otp/resend", resendOtpValidator, validate, authController.resendOtp);
  router.post("/otp/login", otpLoginValidator, validate, authController.otpLogin);

  return router;
};
