import { Router } from "express";
import * as controller from "./supplierOrders.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(protect);

// All routes require manage_allocations or manage_suppliers permission
const requirePermission = checkPermission("manage_allocations");

// Routes
router.get("/", requirePermission, controller.getAll);
router.get("/summary", requirePermission, controller.getSummary);
router.get("/by-supplier/:supplierId", requirePermission, controller.getBySupplier);
router.get("/:id", requirePermission, controller.getById);
router.post("/", requirePermission, controller.create);
router.put("/:id", requirePermission, controller.update);
router.delete("/:id", requirePermission, controller.remove);
router.patch("/:id/status", requirePermission, controller.updateStatus);
router.post("/:id/payment", requirePermission, controller.addPayment);
router.post("/:id/receive", requirePermission, controller.receiveItems);

export default router;
