import Razorpay from "razorpay";

let client;

export const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured");
  }

  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  return client;
};

export const createRefund = async ({ razorpayPaymentId, amount, receipt }) => {
  // Razorpay expects the smallest currency unit; application monetary values are rupees.
  const refund = await getRazorpayClient().payments.refund(razorpayPaymentId, {
    amount: Math.round(amount * 100),
    receipt,
  });

  return refund;
};
