import { Router } from "express";
import * as controller from "./quotations.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";

const router = Router();

// All routes require login
router.use(protect);

// Buyer routes (must be before /:id routes)
router.get("/my", controller.getMyQuotations);

// Admin routes
router.get("/", checkPermission("manage_orders"), controller.getAll);
router.post("/", checkPermission("manage_orders"), controller.create);
router.put("/:id", checkPermission("manage_orders"), controller.update);
router.delete("/:id", checkPermission("manage_orders"), controller.remove);

// Admin action - Send email
router.post("/:id/send-email", checkPermission("manage_orders"), controller.sendEmail);

// Shared routes - buyer sees own, admin sees any
router.get("/:id", controller.getByIdForBuyer);

// Buyer actions
router.put("/:id/accept", controller.accept);
router.put("/:id/reject", controller.reject);
router.post("/:id/inquiry", controller.sendInquiry);

export default router;
