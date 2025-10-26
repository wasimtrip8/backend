import express from "express";
import { authenticateJWT, authorizeRoles } from "../middlewares/auth";
import { QuotationController } from "../controllers/quotation";
import { createQuotationValidator } from "../validators/quotation";
import { UserRole } from "../types/enum";

export const quotation = (db: any) => {
  const router = express.Router();
  const controller = new QuotationController(db);

    router.get("/", authenticateJWT, controller.getUserQuotations);

  router.post(
    "/", authenticateJWT,
    createQuotationValidator,
    controller.createQuotation);

  router.post("/quote/:id", authenticateJWT, authorizeRoles([UserRole.VENDOR]), controller.quoteOrRejectQuotation);
  router.post("/reject/:id", authenticateJWT, authorizeRoles([UserRole.VENDOR]), controller.quoteOrRejectQuotation);


  router.get("/:id", authenticateJWT, controller.getQuotationById);
  router.delete("/:id", authenticateJWT, controller.deleteQuotationById);

  return router;
};
