import { Router } from "express";
import { protect, authorize } from "../../middlewares/auth.middleware.js";
import { ROLES } from "../../constants/index.js";
import {
  getAll,
  getById,
  create,
  update,
  remove,
  search,
  getStats,
  bulkImport,
  getFiscalYears,
  getBuyers,
} from "./archives.controller.js";

const router = Router();

// ===========================
// All routes require authentication
// ===========================
router.use(protect);

// ===========================
// Admin only routes
// ===========================
router.use(authorize(ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN));

// ===========================
// GET routes
// ===========================
router.get("/", getAll);
router.get("/search", search);
router.get("/stats", getStats);
router.get("/fiscal-years", getFiscalYears);
router.get("/buyers", getBuyers);
router.get("/:id", getById);

// ===========================
// POST routes
// ===========================
router.post("/", create);
router.post("/bulk", bulkImport);

// ===========================
// PUT routes
// ===========================
router.put("/:id", update);

// ===========================
// DELETE routes
// ===========================
router.delete("/:id", remove);

export default router;
