import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { checkPermission } from "../../middlewares/auth.middleware.js";
import * as controller from "./reports.controller.js";

const router = Router();

// All report routes require authentication + admin permission
router.use(protect);

// GET /api/reports/types — list available report types
router.get("/types", checkPermission("view_analytics"), controller.getReportTypes);

// GET /api/reports/download-pdf?type=invoices&status=PAID&from=...&to=...
router.get("/download-pdf", checkPermission("view_analytics"), controller.downloadReport);

export default router;
