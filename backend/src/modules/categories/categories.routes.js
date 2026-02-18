import { Router } from "express";
import * as controller from "./categories.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";
import { uploadSingle } from "../../middlewares/upload.middleware.js";

const router = Router();

// Public routes (no login required)
router.get("/", controller.getAll);
router.get("/:id", controller.getById);

// Admin routes (SUPER_ADMIN or SUB_ADMIN with manage_products permission)
// POST and PUT use uploadSingle for category icon (form-data, field name: "image")
router.post("/", protect, checkPermission("manage_products"), uploadSingle, controller.create);
router.put("/:id", protect, checkPermission("manage_products"), uploadSingle, controller.update);
router.delete("/:id", protect, checkPermission("manage_products"), controller.remove);

// Sub-category routes (admin only)
router.post("/:id/subcategories", protect, checkPermission("manage_products"), controller.addSubCategory);
router.put("/:id/subcategories/:subId", protect, checkPermission("manage_products"), controller.updateSubCategory);
router.delete("/:id/subcategories/:subId", protect, checkPermission("manage_products"), controller.removeSubCategory);

export default router;
