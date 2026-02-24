import { Router } from "express";
import * as controller from "./proformaInvoices.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";

const router = Router();

// All routes require login
router.use(protect);

// Buyer routes
router.get("/my", controller.getMyProformas);

// Admin routes
router.get("/", checkPermission("manage_quotes"), controller.getAll);
router.get("/open", checkPermission("manage_dispatch"), controller.getOpenPIs); // PIs with remaining items
router.get("/completed", checkPermission("manage_dispatch"), controller.getCompletedPIs); // Fully dispatched PIs
router.post("/", checkPermission("manage_quotes"), controller.create);
router.put("/:id", checkPermission("manage_quotes"), controller.update);
router.put("/:id/approve", checkPermission("manage_quotes"), controller.approve);
router.put("/:id/reject", checkPermission("manage_quotes"), controller.reject);
router.post("/:id/convert-to-order", checkPermission("manage_quotes"), controller.convertToOrder);

// Admin action - Send email
router.post("/:id/send-email", checkPermission("manage_quotes"), controller.sendEmail);

// Admin action - Clone PI
router.post("/:id/clone", checkPermission("manage_quotes"), controller.clone);

// Shared — buyer sees own, admin sees any
router.get("/:id", controller.getById);

export default router;
