import { Router } from "express";
import * as controller from "./paymentRecords.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";
import { uploadPaymentProof } from "../../middlewares/upload.middleware.js";

const router = Router();

// All routes require login
router.use(protect);

// Buyer routes
router.get("/my", controller.getMyRecords);
router.post("/", uploadPaymentProof, controller.create);
router.put("/:id/update-proof", uploadPaymentProof, controller.updateProof);
router.put("/:id/update", uploadPaymentProof, controller.update);

// Admin routes
router.get("/", checkPermission("manage_quotes"), controller.getAll);
router.get("/pending", checkPermission("manage_quotes"), controller.getPending);
router.post("/admin-collect", checkPermission("manage_quotes"), uploadPaymentProof, controller.adminCollect);
router.put("/:id/verify", checkPermission("manage_quotes"), controller.verify);
router.put("/:id/reject", checkPermission("manage_quotes"), controller.reject);
router.put("/:id/admin-update", checkPermission("manage_quotes"), uploadPaymentProof, controller.adminUpdate);

// Shared routes
router.get("/by-pi/:piId", controller.getByProformaInvoice);
router.get("/:id", controller.getById);

export default router;
