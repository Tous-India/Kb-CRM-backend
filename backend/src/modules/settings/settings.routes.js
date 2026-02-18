import { Router } from "express";
import * as controller from "./settings.controller.js";
import { protect, authorize } from "../../middlewares/auth.middleware.js";
import { ROLES } from "../../constants/index.js";

const router = Router();

// All routes require login + SUPER_ADMIN
router.use(protect);
router.use(authorize(ROLES.SUPER_ADMIN));

router.get("/", controller.getAll);
router.get("/category/:category", controller.getByCategory);
router.post("/", controller.create);
router.put("/bulk", controller.bulkUpdate);
router.put("/:key", controller.update);
router.delete("/:key", controller.remove);
router.get("/:key", controller.getByKey);

export default router;
