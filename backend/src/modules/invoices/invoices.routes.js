import { Router } from "express";
import * as controller from "./invoices.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";

const router = Router();

// All routes require login
router.use(protect);

// Buyer routes
router.get("/my", controller.getMyInvoices);

// Admin routes - List and Create
router.get("/", checkPermission("manage_invoices"), controller.getAll);
router.post("/", checkPermission("manage_invoices"), controller.create);
router.post("/manual", checkPermission("manage_invoices"), controller.createManual);
router.post("/from-pi", checkPermission("manage_invoices"), controller.createFromPI);

// Admin routes - Update
router.put("/:id", checkPermission("manage_invoices"), controller.update);
router.put("/:id/status", checkPermission("manage_invoices"), controller.updateStatus);
router.put("/:id/items", checkPermission("manage_invoices"), controller.updateItems);

// Admin routes - Delete and Duplicate
router.delete("/:id", checkPermission("manage_invoices"), controller.remove);
router.post("/:id/duplicate", checkPermission("manage_invoices"), controller.duplicate);

// Admin action - Send email
router.post("/:id/send-email", checkPermission("manage_invoices"), controller.sendEmail);

// Shared — buyer sees own, admin sees any
router.get("/by-pi/:piId", controller.getByPI);
router.get("/:id", controller.getById);
router.get("/:id/pdf", controller.downloadPdf);

export default router;
