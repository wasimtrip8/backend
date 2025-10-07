import express from "express";
import { authenticateJWT } from "../middlewares/auth";
import { QuotationController } from "../controllers/quotation";
import { createQuotationValidator } from "../validators/quotation";

export const quotation = (db: any) => {
   const router = express.Router();
  const controller = new QuotationController(db);

  router.post(
    "/",authenticateJWT,
    createQuotationValidator,
    controller.createQuotation);

  router.get("/", authenticateJWT, controller.getUserQuotations);
  router.get("/:id", authenticateJWT, controller.getQuotationById);
  router.delete("/:id", authenticateJWT, controller.deleteQuotationById);

  return router;
};
