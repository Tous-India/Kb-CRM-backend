import { Router } from "express";
import * as controller from "./dashboard.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";

const router = Router();

// All dashboard routes require login + view_analytics permission
router.use(protect);
router.use(checkPermission("view_analytics"));

router.get("/summary", controller.getSummary);
router.get("/sales-overview", controller.getSalesOverview);
router.get("/recent-orders", controller.getRecentOrders);
router.get("/pending-payments", controller.getPendingPayments);
router.get("/inventory-alerts", controller.getInventoryAlerts);
router.get("/top-products", controller.getTopProducts);
router.get("/top-buyers", controller.getTopBuyers);
router.get("/order-status-breakdown", controller.getOrderStatusBreakdown);
router.get("/revenue-by-month", controller.getRevenueByMonth);

export default router;
