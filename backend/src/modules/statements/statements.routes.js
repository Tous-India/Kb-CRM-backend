import { Router } from "express";
import * as controller from "./statements.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";

const router = Router();

// All routes require login
router.use(protect);

// Buyer routes
router.get("/my", controller.getMyStatement);

// Admin routes
router.get("/", checkPermission("manage_invoices"), controller.getAll);
router.get("/transactions", checkPermission("manage_invoices"), controller.getTransactions);
router.get("/transactions/by-month", checkPermission("manage_invoices"), controller.getTransactionsByMonth);
router.get("/transactions/by-buyer/:buyerId", checkPermission("manage_invoices"), controller.getTransactionsByBuyer);
router.post("/generate", checkPermission("manage_invoices"), controller.generate);
router.get("/customer/:customerId", checkPermission("manage_invoices"), controller.getByCustomer);

// Shared
router.get("/:id/pdf", controller.downloadPdf);

export default router;
