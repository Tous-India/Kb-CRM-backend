import { Router } from "express";
import * as controller from "./dashboard.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";

const router = Router();

// All dashboard routes require login
router.use(protect);

// ===== Buyer Dashboard Routes (any logged-in user) =====
router.get("/buyer-stats", controller.getBuyerStats);
router.get("/buyer-recent-orders", controller.getBuyerRecentOrders);

// ===== Admin Dashboard Routes (require view_analytics permission) =====
router.get("/summary", checkPermission("view_analytics"), controller.getSummary);
router.get("/sales-overview", checkPermission("view_analytics"), controller.getSalesOverview);
router.get("/recent-orders", checkPermission("view_analytics"), controller.getRecentOrders);
router.get("/pending-payments", checkPermission("view_analytics"), controller.getPendingPayments);
router.get("/inventory-alerts", checkPermission("view_analytics"), controller.getInventoryAlerts);
router.get("/top-products", checkPermission("view_analytics"), controller.getTopProducts);
router.get("/top-buyers", checkPermission("view_analytics"), controller.getTopBuyers);
router.get("/order-status-breakdown", checkPermission("view_analytics"), controller.getOrderStatusBreakdown);
router.get("/revenue-by-month", checkPermission("view_analytics"), controller.getRevenueByMonth);

export default router;
