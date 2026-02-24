import { Router } from "express";
import * as controller from "./dispatches.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";

const router = Router();

// All routes require login
router.use(protect);

// Buyer routes - My dispatches
router.get("/my", controller.getMyDispatches);

// Admin routes - List and Create
router.get("/", checkPermission("manage_dispatch"), controller.getAll);
router.post("/", checkPermission("manage_dispatch"), controller.create);

// Admin routes - Get by source
router.get("/by-source/:sourceType/:sourceId", checkPermission("manage_dispatch"), controller.getBySource);
router.get("/summary/:sourceType/:sourceId", checkPermission("manage_dispatch"), controller.getSummary);

// Admin routes - Single dispatch
router.get("/:id", checkPermission("manage_dispatch"), controller.getById);
router.delete("/:id", checkPermission("manage_dispatch"), controller.remove);

// Admin action - Send email
router.post("/:id/send-email", checkPermission("manage_dispatch"), controller.sendEmail);

export default router;
