import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api/payment-modes';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// 🔐 Include JWT token in every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ⚠️ Handle global 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) console.error('Unauthorized: please log in.');
    return Promise.reject(error.response?.data || error);
  }
);

/**
 * 📄 Get all payment modes with pagination
 * @param {number} page
 * @param {number} limit
 * @param {string} search
 */
export const getAllPaymentModes = async (page = 1, limit = 10, search = '') => {
  const params = { page, limit };
  if (search) params.search = search;
  const response = await axiosInstance.get('/', { params });
  return response.data; // { paymentModes, totalPages, page }
};

/**
 * 📋 Get a payment mode by ID
 * @param {string} id
 */
export const getPaymentModeById = async (id) => {
  const response = await axiosInstance.get(`/${id}`);
  return response.data.paymentMode;
};

/**
 * ➕ Create a new payment mode
 * @param {object} data - { code, displayName, requiresProof, description }
 */
export const createPaymentMode = async (data) => {
  const response = await axiosInstance.post('/', data);
  return response.data.paymentMode;
};

/**
 * ✏️ Update payment mode
 * @param {string} id
 * @param {object} data
 */
export const updatePaymentMode = async (id, data) => {
  const response = await axiosInstance.put(`/${id}`, data);
  return response.data.paymentMode;
};

/**
 * 🗑️ Soft delete payment mode
 * @param {string} id
 */
export const deletePaymentMode = async (id) => {
  const response = await axiosInstance.delete(`/${id}`);
  return response.data.message;
};

/**
 * ♻️ Restore payment mode (Admin only)
 * @param {string} id
 */
export const restorePaymentMode = async (id) => {
  const response = await axiosInstance.patch(`/${id}/restore`);
  return response.data.paymentMode;
};
