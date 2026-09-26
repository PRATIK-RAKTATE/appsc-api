import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tag, ShieldCheck, CreditCard, Sparkles, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCourseStore } from '../../stores/courseStore';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input, Card, Badge } from '../../components/ui';

export const CheckoutPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const {
    fetchCourseById,
    currentCourse,
    validateCoupon,
    activeCoupon,
    clearCoupon,
    createOrder,
    verifyPayment,
  } = useCourseStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/checkout/${courseId}` } } });
      return;
    }
    if (courseId) {
      fetchCourseById(courseId);
    }
    return () => clearCoupon();
  }, [courseId, isAuthenticated, fetchCourseById, clearCoupon, navigate]);

  const course = currentCourse || {
    _id: courseId,
    title: 'APPSC Group 1 Comprehensive Bilingual Prelims & Mains Bundle',
    discountedPrice: 3999,
    basePrice: 7999,
    validityInDays: 365,
  };

  const originalAmount = course.discountedPrice || course.basePrice || 1999;
  const discountAmount = activeCoupon ? activeCoupon.discountAmount : 0;
  const finalAmount = activeCoupon ? activeCoupon.finalAmount : originalAmount;

  // Coupon Validation Handler
  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    if (!couponInput.trim()) return;

    setCouponError('');
    setCouponSuccess('');

    const result = await validateCoupon(couponInput.trim(), course._id);
    if (result.success) {
      setCouponSuccess(`Coupon "${result.data.couponCode}" applied successfully! You saved ₹${result.data.discountAmount}`);
    } else {
      setCouponError(result.message || 'Invalid coupon code');
    }
  };

  // Razorpay Checkout Execution
  const handleProceedPayment = async () => {
    setIsProcessing(true);
    setCouponError('');

    try {
      // 1. Create Order on Backend
      const orderRes = await createOrder(course._id, activeCoupon?.couponCode);
      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Failed to create payment order');
      }

      const { razorpayOrderId, amount, currency, keyId, orderId } = orderRes.data;

      // 2. Setup Razorpay Options
      const options = {
        key: keyId || 'rzp_test_key',
        amount: amount,
        currency: currency || 'INR',
        name: 'APPSC Prep',
        description: course.title,
        order_id: razorpayOrderId,
        prefill: {
          name: user?.fullName || 'APPSC Aspirant',
          email: user?.email || '',
        },
        theme: {
          color: '#f59e0b',
        },
        handler: async (response) => {
          // 3. Verify Signature on Server
          const verifyRes = await verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });

          if (verifyRes.success) {
            triggerConfetti();
            setPaymentCompleted(true);
            setCompletedOrder({
              orderId: orderId || response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              amount: finalAmount,
            });
          } else {
            setCouponError('Payment verification failed on server.');
          }
          setIsProcessing(false);
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      // 4. Trigger Razorpay Modal
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback for test simulation if script blocked
        alert('Simulating test payment completion...');
        triggerConfetti();
        setPaymentCompleted(true);
        setCompletedOrder({
          orderId: `ORD-${Date.now()}`,
          paymentId: `PAY-${Date.now()}`,
          amount: finalAmount,
        });
        setIsProcessing(false);
      }
    } catch (err) {
      setCouponError(err.message || 'Payment initiation failed.');
      setIsProcessing(false);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#38bdf8', '#ffffff'],
    });
  };

  if (paymentCompleted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <Card className="max-w-lg w-full text-center p-8 border-amber-500/30 glass-panel shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-500" />

          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-6 shadow-lg shadow-emerald-500/10 animate-bounce">
            <CheckCircle className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Enrollment Activated!</h2>
          <p className="text-xs text-neutral-400 mb-6">
            Congratulations! Your entitlement for <strong className="text-white">{course.title}</strong> is active for {course.validityInDays} days.
          </p>

          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-left space-y-2 mb-6 text-xs text-neutral-300">
            <div className="flex justify-between">
              <span className="text-neutral-500">Order Reference:</span>
              <span className="font-mono text-neutral-200">{completedOrder?.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Amount Paid:</span>
              <span className="font-bold text-emerald-400">₹{completedOrder?.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Validity:</span>
              <span>{course.validityInDays} Days</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              onClick={() => navigate('/student/invoices')}
            >
              View Invoices
            </Button>
            <Button
              variant="accent"
              size="md"
              className="flex-1"
              icon={ArrowRight}
              onClick={() => navigate('/student/dashboard')}
            >
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Order Checkout</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Review your selection and complete secure instant activation via Razorpay.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Order Summary & Coupon */}
        <div className="md:col-span-2 space-y-6">
          <Card className="glass-panel border-neutral-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Course Summary</span>
            </h3>

            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex justify-between items-start gap-4">
              <div>
                <h4 className="text-sm font-semibold text-neutral-100">{course.title}</h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Validity Period: <strong className="text-amber-400">{course.validityInDays} Days</strong>
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="accent" size="sm">Bilingual Telugu/English</Badge>
                  <Badge variant="neutral" size="sm">All Modules Included</Badge>
                </div>
              </div>
              <span className="text-lg font-bold text-white shrink-0">₹{originalAmount}</span>
            </div>
          </Card>

          {/* Coupon Code Card */}
          <Card className="glass-panel border-neutral-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-400" />
              <span>Apply Discount Coupon</span>
            </h3>

            <form onSubmit={handleApplyCoupon} className="flex gap-3">
              <Input
                placeholder="Enter coupon code (e.g. APPSC50)"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="uppercase font-mono"
              />
              <Button type="submit" variant="secondary" size="md">
                Apply
              </Button>
            </form>

            {/* Quick Coupon Suggestions */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-neutral-500">Available Coupons:</span>
              <button
                type="button"
                onClick={() => setCouponInput('APPSC50')}
                className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
              >
                APPSC50 (50% Off)
              </button>
              <button
                type="button"
                onClick={() => setCouponInput('WELCOME10')}
                className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
              >
                WELCOME10 (10% Off)
              </button>
            </div>

            {couponSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{couponSuccess}</span>
              </div>
            )}

            {couponError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{couponError}</span>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Price Breakdown & Payment CTA */}
        <div>
          <Card className="glass-panel border-neutral-800 p-6 space-y-6 sticky top-24">
            <h3 className="text-base font-bold text-white border-b border-neutral-800 pb-3">
              Payment Summary
            </h3>

            <div className="space-y-3 text-xs text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-400">Subtotal</span>
                <span>₹{originalAmount}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Coupon Discount ({activeCoupon?.couponCode})</span>
                  <span>- ₹{discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-neutral-400">GST (18% Included)</span>
                <span>₹{Math.round(finalAmount * 0.18)}</span>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-between text-sm font-bold text-white">
                <span>Final Payable</span>
                <span className="text-xl text-amber-400">₹{finalAmount}</span>
              </div>
            </div>

            <Button
              variant="accent"
              size="lg"
              className="w-full shadow-lg shadow-amber-500/20"
              icon={CreditCard}
              isLoading={isProcessing}
              onClick={handleProceedPayment}
            >
              Pay via Razorpay • ₹{finalAmount}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>256-bit Secure Razorpay Payment Gateway</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
