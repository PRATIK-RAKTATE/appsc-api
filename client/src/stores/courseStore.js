import { create } from 'zustand';
import api from '../services/api';

export const useCourseStore = create((set, get) => ({
  courses: [],
  enrolledCourses: [],
  currentCourse: null,
  activeCoupon: null,
  invoices: [],
  isLoading: false,
  error: null,

  // Fetch public / student course catalog
  fetchCourses: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/admin/courses', {
        params: { status: 'PUBLISHED', ...params },
      });
      const courses = response.data.data || [];
      set({ courses, isLoading: false });
      return courses;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return [];
    }
  },

  // Fetch course details by ID
  fetchCourseById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/admin/courses/${id}`);
      const course = response.data.data;
      set({ currentCourse: course, isLoading: false });
      return course;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return null;
    }
  },

  // Validate coupon code at checkout
  validateCoupon: async (couponCode, courseId) => {
    try {
      const response = await api.post('/payments/coupons/validate', {
        couponCode,
        courseId,
      });
      if (response.data.success) {
        set({ activeCoupon: response.data.data });
        return { success: true, data: response.data.data };
      }
      return { success: false, message: 'Invalid coupon code' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid coupon code';
      return { success: false, message: msg };
    }
  },

  // Clear active coupon
  clearCoupon: () => set({ activeCoupon: null }),

  // Create Razorpay payment order
  createOrder: async (courseId, couponCode = null) => {
    try {
      const response = await api.post('/payments/create-order', {
        courseId,
        couponCode: couponCode || undefined,
      });
      return { success: true, data: response.data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to initiate order';
      return { success: false, message: msg };
    }
  },

  // Verify Razorpay payment signature
  verifyPayment: async (paymentData) => {
    try {
      const response = await api.post('/payments/verify', paymentData);
      return { success: true, data: response.data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment verification failed';
      return { success: false, message: msg };
    }
  },

  // Download PDF invoice
  downloadInvoice: async (orderId, invoiceNumber = 'invoice') => {
    try {
      const response = await api.get(`/payments/orders/${orderId}/invoice`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Failed to download invoice' };
    }
  },
}));
