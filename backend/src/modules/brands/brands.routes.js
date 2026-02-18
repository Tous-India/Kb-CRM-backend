import { Router } from "express";
import * as controller from "./brands.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";
import { uploadSingle } from "../../middlewares/upload.middleware.js";

const router = Router();

// Public routes
router.get("/", controller.getAll);
router.get("/:id", controller.getById);

// Admin routes (require login + manage_products permission)
router.post("/", protect, checkPermission("manage_products"), uploadSingle, controller.create);
router.put("/:id", protect, checkPermission("manage_products"), uploadSingle, controller.update);
router.delete("/:id", protect, checkPermission("manage_products"), controller.remove);

export default router;
