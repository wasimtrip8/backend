import { body } from "express-validator";
import { UserRole } from "../types/enum";

export const refreshValidator = [
  body("refresh_token")
    .isString()
    .notEmpty()
    .withMessage("refresh_token is required"),
];

export const sendOtpValidator = [
  body("mobile_email")
    .isString()
    .notEmpty()
    .withMessage("mobile_email is required"),
  body("platform_id")
    .optional()
    .isString()
    .withMessage("platform_id must be a string"),
  body("verification_type")
    .optional()
    .isString()
    .withMessage("verification_type must be a string"),
];

export const verifyOtpValidator = [
  body("mobile_email")
    .isString()
    .notEmpty()
    .withMessage("mobile_email is required"),
  body("otp")
    .isString()
    .notEmpty()
    .withMessage("otp is required"),
  body("platform_id")
    .optional()
    .isString()
    .withMessage("platform_id must be a string"),
];

export const resendOtpValidator = [
  body("mobile_email")
    .isString()
    .notEmpty()
    .withMessage("mobile_email is required"),
];

export const otpLoginValidator = [
  body("mobile_email")
    .isString()
    .notEmpty()
    .withMessage("mobile_email is required"),
  body("otp")
    .isString()
    .notEmpty()
    .withMessage("otp is required"),
  body("role")
    .optional()
    .isString()
    .isIn(Object.values(UserRole))
    .withMessage(`role must be one of: ${Object.values(UserRole).join(", ")}`),
  body("platform_id")
    .optional()
    .isString()
    .withMessage("platform_id must be a string"),
  body("name")
    .optional()
    .isString()
    .withMessage("name must be a string"),
  body("source")
    .optional()
    .isString()
    .withMessage("source must be a string"),
];
