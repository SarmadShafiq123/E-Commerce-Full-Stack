import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// ── Silent token refresh on 401 TOKEN_EXPIRED ─────────────────────────────────
let isRefreshing = false;
let refreshQueue = []; // queued requests waiting for the new access token

const processQueue = (error) => {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    const isExpired =
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry;

    // Don't retry the refresh endpoint itself — would cause infinite loop
    if (!isExpired || original.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the ongoing refresh completes
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(() => api(original)).catch((e) => Promise.reject(e));
    }

    original._retry = true;
    isRefreshing = true;

    try {
      await api.post('/auth/refresh'); // sets new access cookie automatically
      processQueue(null);
      return api(original);           // retry original request
    } catch (refreshError) {
      processQueue(refreshError);
      // Refresh failed — force logout by clearing user state
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ── API namespaces ────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  logoutAll: () => api.post('/auth/logout-all'),
  refresh: () => api.post('/auth/refresh'),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getWishlist: () => api.get('/users/wishlist'),
  addToWishlist: (id) => api.post(`/users/wishlist/${id}`),
  removeFromWishlist: (id) => api.delete(`/users/wishlist/${id}`),
};

export const productAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  getAllProductsAdmin: (params) => api.get('/products/admin/all', { params }),
  createProduct: (formData) =>
    api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProduct: (id, formData) =>
    api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  deleteProductImage: (productId, publicId) =>
    api.delete(`/products/${productId}/images/${publicId}`),
};

export const orderAPI = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
};

export const adminAPI = {
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  updateOrder: (id, data) => api.put(`/admin/orders/${id}`, data),
  getStats: () => api.get('/admin/stats'),
  getAnalytics: () => api.get('/admin/analytics'),
  downloadInvoice: (id) => api.get(`/admin/orders/${id}/invoice`, { responseType: 'blob' }),
  emailInvoice: (id) => api.post(`/admin/orders/${id}/invoice/email`),
  getInventory: (params) => api.get('/admin/inventory', { params }),
  getLowStockAlerts: () => api.get('/admin/inventory/alerts'),
  updateStock: (id, data) => api.patch(`/admin/inventory/${id}/stock`, data),
  toggleActive: (id) => api.patch(`/admin/inventory/${id}/toggle`),
  bulkUpdateInventory: (updates) => api.patch('/admin/inventory/bulk', { updates }),
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data) => api.post('/admin/coupons', data),
  updateCoupon: (id, data) => api.put(`/admin/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),
  getAllReviews: (params) => api.get('/admin/reviews', { params }),
  updateReview: (id, data) => api.put(`/admin/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  updateOffer: (id, data) => api.patch(`/admin/products/${id}/offer`, data),
  getNotifications: () => api.get('/admin/notifications'),
  markAllRead: () => api.patch('/admin/notifications/read-all'),
  markOneRead: (id) => api.patch(`/admin/notifications/${id}/read`),
  deleteNotification: (id) => api.delete(`/admin/notifications/${id}`),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

export const reviewAPI = {
  getProductReviews: (productId) => api.get(`/reviews/product/${productId}`),
  submitReview: (data) => api.post('/reviews', data),
};

export const couponAPI = {
  validate: (data) => api.post('/coupons/validate', data),
};

export const aiAPI = {
  getRecommendations: (params) => api.get('/ai/recommendations', { params }),
  chat: (message) => api.post('/ai/chat', { message }),
  getTrending: (params) => api.get('/ai/trending', { params }),
  analyseReview: (text) => api.post('/ai/analyse-review', { text }),
  batchAnalyseReviews: () => api.get('/ai/analyse-reviews'),
  getChatbotResponses: () => api.get('/ai/chatbot-responses'),
  upsertChatbotResponse: (data) => api.post('/ai/chatbot-responses', data),
  deleteChatbotResponse: (id) => api.delete(`/ai/chatbot-responses/${id}`),
};

export const homepageAPI = {
  getHomepage: () => api.get('/homepage'),
  trackClick: (slideId) => api.patch(`/homepage/slide/${slideId}/click`),
  getHomepageAdmin: () => api.get('/homepage/admin'),
  updateHomepage: (data) => api.put('/homepage', data),
  addSlide: (formData) =>
    api.post('/homepage/slide', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateSlide: (id, formData) =>
    api.put(`/homepage/slide/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteSlide: (id) => api.delete(`/homepage/slide/${id}`),
};

export default api;
