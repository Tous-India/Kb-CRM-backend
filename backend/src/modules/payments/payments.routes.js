import { Router } from "express";
import * as controller from "./payments.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";

const router = Router();

// All routes require login
router.use(protect);

// Buyer routes
router.get("/my", controller.getMyPayments);

// Admin routes
router.get("/", checkPermission("manage_payments"), controller.getAll);
router.get("/pending", checkPermission("manage_payments"), controller.getPending);
router.get("/customer/:customerId", checkPermission("manage_payments"), controller.getByCustomer);
router.post("/", checkPermission("manage_payments"), controller.create);
router.put("/:id", checkPermission("manage_payments"), controller.update);
router.put("/:id/status", checkPermission("manage_payments"), controller.updateStatus);

// Shared — buyer sees own, admin sees any
router.get("/:id", controller.getById);

export default router;
