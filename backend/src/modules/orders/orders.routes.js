import { Router } from "express";
import * as controller from "./orders.controller.js";
import { protect, checkPermission, optionalAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

// Public/Optional auth routes (for quote requests from logged-in buyers)
router.post("/quote-request", optionalAuth, controller.submitQuoteRequest);

// All other routes require login
router.use(protect);

// Buyer routes
router.get("/my", controller.getMyOrders);
router.post("/:id/clone", controller.cloneOrder); // Buyer can clone their own orders

// Admin routes
router.get("/", checkPermission("manage_orders"), controller.getAll);
router.get("/pending", checkPermission("manage_orders"), controller.getPending);
router.get("/open", checkPermission("manage_orders"), controller.getOpen);
router.get("/dispatched", checkPermission("manage_orders"), controller.getDispatched);
router.post("/", checkPermission("manage_orders"), controller.create);
router.post("/:id/convert-to-quotation", checkPermission("manage_orders"), controller.convertToQuotation);
router.put("/:id", checkPermission("manage_orders"), controller.update);
router.put("/:id/status", checkPermission("manage_orders"), controller.updateStatus);
router.put("/:id/dispatch", checkPermission("manage_dispatch"), controller.dispatch);
router.put("/:id/partial-dispatch", checkPermission("manage_dispatch"), controller.partialDispatch);
router.put("/:id/dispatch-info", checkPermission("manage_dispatch"), controller.updateDispatchInfo);
router.post("/:id/payment", checkPermission("manage_payments"), controller.recordPayment);

// Shared — buyer sees own, admin sees any
router.get("/:id", controller.getById);

export default router;
