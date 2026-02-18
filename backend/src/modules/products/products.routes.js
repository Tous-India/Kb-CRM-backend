import { Router } from "express";
import * as controller from "./products.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";
import { uploadMultiple } from "../../middlewares/upload.middleware.js";

const router = Router();

// Public routes (no login required — buyers see no pricing)
router.get("/", controller.getAll);
router.get("/search", controller.search);
router.get("/category/:categoryName", controller.getByCategory);
router.get("/brand/:brandName", controller.getByBrand);
router.get("/:id", controller.getById);

// Admin routes (SUPER_ADMIN or SUB_ADMIN with manage_products)
router.post("/", protect, checkPermission("manage_products"), controller.create);
router.put("/:id", protect, checkPermission("manage_products"), controller.update);
router.delete("/:id", protect, checkPermission("manage_products"), controller.remove);
router.put("/:id/inventory", protect, checkPermission("manage_products"), controller.updateInventory);

// Image routes (form-data, field name: "images")
router.post("/:id/images", protect, checkPermission("manage_products"), uploadMultiple, controller.uploadImages);
router.put("/:id/main-image", protect, checkPermission("manage_products"), uploadMultiple, controller.updateMainImage);
router.delete("/:id/images/:imageId", protect, checkPermission("manage_products"), controller.deleteImage);

export default router;
