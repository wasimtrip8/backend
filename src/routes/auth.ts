import { Router } from "express";
import { login, register, profile } from "../controllers/auth";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, profile);

export default router;
