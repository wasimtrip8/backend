// router/routes.ts
import { Router } from "express";
import { auth } from "../routes/auth";
import { trip } from "./trip";
import { quotation } from "../routes/quotation";
import { user } from "../routes/user";
import { assets } from "./assets";
import { payments } from "./payments";

export function setupRoutes(db: any): Router {
  const router = Router();

  router.use("/api/auth", auth(db));
  router.use("/api/trip", trip(db));
  router.use("/api/quotations", quotation(db));
  router.use("/api/users", user(db));
  router.use("/api/assets", assets(db));
   router.use("/api/payment", payments(db));

  router.get("/ping", (_req, res) => {
    res.json({ status: "alive", timestamp: new Date() });
  });

  return router;
}
