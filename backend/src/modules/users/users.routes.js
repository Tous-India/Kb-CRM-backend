import { Router } from "express";
import * as controller from "./users.controller.js";
import { protect, authorize, checkPermission } from "../../middlewares/auth.middleware.js";
import { ROLES } from "../../constants/index.js";

const router = Router();

// All routes require login
router.use(protect);

// Admin routes (manage_users permission)
router.get("/", checkPermission("manage_users"), controller.getAll);
router.get("/buyers", checkPermission("manage_users"), controller.getBuyers);
router.post("/", checkPermission("manage_users"), controller.create);
router.put("/:id", checkPermission("manage_users"), controller.update);
router.delete("/:id", checkPermission("manage_users"), controller.remove);
router.put("/:id/activate", checkPermission("manage_users"), controller.activate);
router.put("/:id/deactivate", checkPermission("manage_users"), controller.deactivate);

// SUPER_ADMIN only routes
router.get("/sub-admins", authorize(ROLES.SUPER_ADMIN), controller.getSubAdmins);
router.post("/sub-admin", authorize(ROLES.SUPER_ADMIN), controller.createSubAdmin);
router.put("/:id/permissions", authorize(ROLES.SUPER_ADMIN), controller.updatePermissions);

// Shared
router.get("/:id", checkPermission("manage_users"), controller.getById);

export default router;
