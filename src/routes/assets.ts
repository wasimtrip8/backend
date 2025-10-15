import express from "express";
import { AssetsController } from "../controllers/assets";
import { authenticateJWT } from "../middlewares/auth";

export const assets = (db: any) => {
  const router = express.Router();
  const controller = new AssetsController(db);

  router.get("/range", authenticateJWT, controller.getAssetPriceRange);
  router.get("/", authenticateJWT, controller.getAssetsByCategory);

  return router;
};
