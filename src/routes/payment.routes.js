import express from "express";
import {
  createOrderController,
  downloadInvoiceController,
  refundPaymentController,
  validateCouponController,
  verifyPaymentController,
} from "../controllers/payment.controller.js";
import { requireRole, verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create-order", verifyToken, createOrderController);
router.post("/verify", verifyToken, verifyPaymentController);
router.post("/coupons/validate", verifyToken, validateCouponController);
router.get("/orders/:orderId/invoice", verifyToken, downloadInvoiceController);
router.post("/:paymentId/refunds", verifyToken, requireRole("ADMIN"), refundPaymentController);

export default router;
