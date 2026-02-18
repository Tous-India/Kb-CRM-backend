import { Router } from "express";
import * as controller from "./carts.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = Router();

// All cart routes require login
router.use(protect);

router.get("/", controller.getMyCart);
router.post("/items", controller.addItem);
router.put("/items/:itemId", controller.updateItem);
router.delete("/items/:itemId", controller.removeItem);
router.delete("/", controller.clearCart);
router.post("/checkout", controller.checkout);

export default router;
