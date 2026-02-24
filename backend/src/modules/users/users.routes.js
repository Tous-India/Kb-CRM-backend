import { Router } from "express";
import * as controller from "./users.controller.js";
import { protect, authorize, checkPermission } from "../../middlewares/auth.middleware.js";
import { ROLES } from "../../constants/index.js";

const router = Router();

// All routes require login
router.use(protect);

// Profile routes (any authenticated user can access their own profile)
// IMPORTANT: These must be BEFORE /:id routes to avoid conflicts
router.get("/profile/me", controller.getProfile);
router.put("/profile/me", controller.updateProfile);
router.put("/profile/password", controller.changePassword);

// Contact route (any authenticated user can send message to admin via CRM)
router.post("/contact", controller.sendContactMessage);

// Admin routes (manage_users permission)
router.get("/", checkPermission("manage_users"), controller.getAll);
router.get("/buyers", checkPermission("manage_users"), controller.getBuyers);

// Registration approval routes (admin only)
router.get("/pending-approvals", checkPermission("manage_users"), controller.getPendingApprovals);
router.get("/pending-approvals/count", checkPermission("manage_users"), controller.getPendingApprovalsCount);
router.put("/:id/approve", checkPermission("manage_users"), controller.approveUser);
router.put("/:id/reject", checkPermission("manage_users"), controller.rejectUser);

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
