// router/routes.ts
import { Router } from "express";
import { auth } from "../routes/auth";
import { itinerary } from "../routes/itinerary";
import { quotation } from "../routes/quotation";

export function setupRoutes(db: any): Router {
  const router = Router();

  router.use("/auth", auth(db));
  router.use("/itinerary", itinerary(db));
  router.use("/quotations", quotation(db));

  router.get("/ping", (_req, res) => {
    res.json({ status: "alive", timestamp: new Date() });
  });

  return router;
}
