import { body } from "express-validator";
import { QuotationStatus } from "../models/quotation";

export const createQuotationValidator = [
    body("trip_id")
        .notEmpty()
        .isMongoId().withMessage("trip_id must be a valid ObjectId, is required"),

    body("vendor_id")
        .optional()
        .isMongoId().withMessage("vendor_id must be a valid ObjectId"),

    body("car")
        .optional()
        .isObject().withMessage("car must be an object"),

    body("stay")
        .optional()
        .isObject().withMessage("stay must be an object"),

    body("price")
        .optional()
        .isNumeric().withMessage("price must be a number"),

    body("expires_at")
        .optional()
        .isISO8601().withMessage("expires_at must be a valid ISO date"),

    body("status")
        .optional()
        .isIn(Object.values(QuotationStatus))
        .withMessage(`role must be one of: ${Object.values(QuotationStatus).join(", ")}`),

    body("is_deleted")
        .optional()
        .isBoolean().withMessage("is_deleted must be a boolean"),

    body("deleted_at")
        .optional()
        .isISO8601().withMessage("deleted_at must be a valid ISO date")
];
