// src/services/paymentModeService.js
import axios from 'axios';
import { showSuccess, showError, showInfo } from '../utils/toastHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api/payment-modes';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

//  Include JWT token in every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

//  Global 401 handler
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) showError('Unauthorized: please log in.');
    return Promise.reject(error.response?.data || error);
  }
);

// Helper for standardized API call
const handleRequest = async (apiCall, successMessage) => {
  try {
    const response = await apiCall();
    if (successMessage) showSuccess(successMessage);
    return response.data;
  } catch (err) {
    showError(err?.message || 'Something went wrong');
    throw err;
  }
};

//  Get all payment modes with pagination & optional search
export const getAllPaymentModes = async (page = 1, limit = 10, search = '') => {
  const params = { page, limit };
  if (search) params.search = search;
  return handleRequest(() => axiosInstance.get('/', { params }));
};

//  Get a payment mode by ID
export const getPaymentModeById = async (id) => {
  return handleRequest(() => axiosInstance.get(`/${id}`));
};

//  Create a new payment mode
export const createPaymentMode = async (data) => {
  return handleRequest(() => axiosInstance.post('/', data), 'Payment mode created successfully!');
};

//  Update payment mode
export const updatePaymentMode = async (id, data) => {
  return handleRequest(() => axiosInstance.put(`/${id}`, data), 'Payment mode updated successfully!');
};

//  Delete payment mode
export const deletePaymentMode = async (id) => {
  return handleRequest(() => axiosInstance.delete(`/${id}`), 'Payment mode deleted successfully!');
};

//  Restore payment mode (Admin only)
export const restorePaymentMode = async (id) => {
  return handleRequest(() => axiosInstance.patch(`/${id}/restore`), 'Payment mode restored successfully!');
};
