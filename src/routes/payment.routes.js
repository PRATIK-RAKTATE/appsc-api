import express from "express";
import { downloadInvoiceController, refundPaymentController, validateCouponController } from "../controllers/payment.controller.js";
import { requireRole, verifyToken } from "../middleware/auth.middleware.js";
import { auditLog } from "../middleware/audit.middleware.js";

const router = express.Router();

router.post("/coupons/validate", verifyToken, validateCouponController);
router.get("/orders/:orderId/invoice", verifyToken, downloadInvoiceController);
router.post(
  "/:paymentId/refunds",
  verifyToken,
  requireRole("ADMIN"),
  auditLog({ resourceType: "REFUND", action: "CREATE_REFUND" }),
  refundPaymentController
);

export default router;
