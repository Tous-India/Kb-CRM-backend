import { Router } from "express";
import * as controller from "./purchaseDashboard.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";

const router = Router();

// All routes require login and manage_orders permission
router.use(protect);
router.use(checkPermission("manage_orders"));

router.get("/summary", controller.getSummary);
router.get("/supplier-stats", controller.getSupplierStats);
router.get("/pending-allocations", controller.getPendingAllocations);
router.get("/allocation-progress", controller.getAllocationProgress);
router.get("/recent-activity", controller.getRecentActivity);

export default router;
