import { Router } from "express";
import { Auth } from "../controllers/auth";
import { Db } from "mongodb";

export function auth(db: Db) {
  const router = Router();
  const controller = new Auth(db);

  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.post("/refresh", controller.refresh);

  return router;
}