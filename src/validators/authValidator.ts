import { body } from "express-validator";

export const refreshValidator = [
  body("refreshToken")
    .isString()
    .notEmpty()
    .withMessage("refreshToken is required"),
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
  body("code")
    .isString()
    .notEmpty()
    .withMessage("code is required"),
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
  body("code")
    .isString()
    .notEmpty()
    .withMessage("code is required"),
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
