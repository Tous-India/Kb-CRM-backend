import { Router } from "express";
import * as controller from "./suppliers.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication and manage_suppliers permission
router.use(protect);
router.use(checkPermission("manage_suppliers"));

// GET routes
router.get("/", controller.getAll);
router.get("/active", controller.getActive);
router.get("/:id", controller.getById);

// POST routes
router.post("/", controller.create);

// PUT routes
router.put("/:id", controller.update);
router.put("/:id/status", controller.updateStatus);
router.put("/:id/performance", controller.updatePerformance);

// DELETE routes
router.delete("/:id", controller.remove);

export default router;
