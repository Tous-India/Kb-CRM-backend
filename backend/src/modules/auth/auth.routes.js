import { Router } from "express";
import * as authController from "./auth.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = Router();

// Public routes (no login required)
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

// Protected routes (login required)
router.post("/logout", protect, authController.logout);
router.get("/me", protect, authController.getMe);

export default router;
