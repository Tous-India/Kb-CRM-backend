import { Router } from "express";
import * as authController from "./auth.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = Router();

// Public routes (no login required)
router.post("/register", authController.register); // Legacy - direct registration
router.post("/login", authController.login);

// Multi-step registration with OTP verification
router.post("/register/initiate", authController.initiateRegistration);
router.post("/register/verify-otp", authController.verifyRegistrationOTP);
router.post("/register/complete", authController.completeRegistration);
router.post("/register/resend-otp", authController.resendRegistrationOTP);

// Forgot password with OTP verification
router.post("/forgot-password/initiate", authController.forgotPasswordInitiate);
router.post("/forgot-password/verify-otp", authController.forgotPasswordVerifyOTP);
router.post("/forgot-password/reset", authController.forgotPasswordReset);
router.post("/forgot-password/resend-otp", authController.forgotPasswordResendOTP);

// Legacy forgot password (token-based) - kept for backwards compatibility
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

// Protected routes (login required)
router.post("/logout", protect, authController.logout);
router.get("/me", protect, authController.getMe);

export default router;
