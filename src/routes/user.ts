import express from "express";
import { authenticateJWT } from "../middlewares/auth";
import { UserController } from "../controllers/user";
import { updateUserValidator } from "../validators/user";

export const user = (db: any) => {
  const router = express.Router();
  const controller = new UserController(db);

  // Get current user
  router.get("/", authenticateJWT, controller.getUser);

  // Update current user
  router.put("/", authenticateJWT, updateUserValidator, controller.updateUser);

  return router;
};
