import { Router } from "express";
import * as controller from "./piAllocations.controller.js";
import { protect, checkPermission } from "../../middlewares/auth.middleware.js";

const router = Router();

// All routes require login and manage_orders permission
router.use(protect);

router.get("/", checkPermission("manage_orders"), controller.getAll);
router.get("/summary/stats", checkPermission("manage_orders"), controller.getSummary);
router.get("/by-pi/:piId", checkPermission("manage_orders"), controller.getByPI);
router.get("/:id", checkPermission("manage_orders"), controller.getById);
router.post("/", checkPermission("manage_orders"), controller.create);
router.post("/bulk", checkPermission("manage_orders"), controller.bulkSave);
router.put("/:id", checkPermission("manage_orders"), controller.update);
router.delete("/:id", checkPermission("manage_orders"), controller.remove);

export default router;
