import { body } from "express-validator";
import { UserRole, StatusType } from "../types/enum";

// Validator for updating the current user
export const updateUserValidator = [
  body("name").optional().isString().withMessage("Name must be a string"),
  body("email").optional().isEmail().withMessage("Invalid email"),
  body("mobile").optional().isString().withMessage("Invalid mobile number"),
  body("status").optional().isIn(Object.values(StatusType)),
   body("description").optional().isString().withMessage("Description must be a string"),
];
