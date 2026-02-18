import { Router } from "express";
import * as controller from "./purchaseOrders.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";

const router = Router();

// All PO routes require login
router.use(protect);

// Buyer routes
router.get("/my", controller.getMyPurchaseOrders);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.put("/:id/cancel", controller.cancel);

// Shared (buyer sees own, admin sees any)
router.get("/:id", controller.getById);

// Admin routes (SUPER_ADMIN or SUB_ADMIN with manage_orders)
router.get("/", checkPermission("manage_orders"), controller.getAll);
router.put("/:id/reject", checkPermission("manage_orders"), controller.reject);
router.post("/:id/convert-to-quotation", checkPermission("manage_orders"), controller.convertToQuotation);

export default router;
