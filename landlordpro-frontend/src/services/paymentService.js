import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api/payments';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) console.error('Unauthorized: please log in.');
    return Promise.reject(error.response?.data || error);
  }
);

// Get all payments (optional search term)
export const getAllPayments = async (term = '') => {
  const params = term ? { term } : {};
  const response = await axiosInstance.get('/', { params });
  return response.data?.data || [];
};

// Get payment by ID
export const getPaymentById = async (id) => {
  const response = await axiosInstance.get(`/${id}`);
  return response.data?.data || null;
};

// Create a new payment (supports proof and date range)
export const createPayment = async (data) => {
  const formData = new FormData();
  formData.append('amount', data.amount);
  formData.append('leaseId', data.leaseId);
  formData.append('paymentModeId', data.paymentModeId);
  formData.append('startDate', data.startDate);
  formData.append('endDate', data.endDate);
  if (data.propertyId) formData.append('propertyId', data.propertyId);
  if (data.proof) formData.append('proof', data.proof);

  const response = await axiosInstance.post('/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data?.data || null;
};

// Update payment (supports proof and date range)
export const updatePayment = async (id, data) => {
  const formData = new FormData();
  if (data.amount) formData.append('amount', data.amount);
  if (data.leaseId) formData.append('leaseId', data.leaseId);
  if (data.paymentModeId) formData.append('paymentModeId', data.paymentModeId);
  if (data.startDate) formData.append('startDate', data.startDate);
  if (data.endDate) formData.append('endDate', data.endDate);
  if (data.propertyId) formData.append('propertyId', data.propertyId);
  if (data.proof) formData.append('proof', data.proof);

  const response = await axiosInstance.put(`/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data?.data || null;
};

// Soft delete payment
export const softDeletePayment = async (id) => {
  const response = await axiosInstance.delete(`/${id}`);
  return response.data?.message || 'Deleted successfully';
};

// Restore soft-deleted payment
export const restorePayment = async (id) => {
  const response = await axiosInstance.patch(`/${id}/restore`);
  return response.data?.data || null;
};

// Get payment proof URL
export const getPaymentProofUrl = (paymentId, filename) => {
  return `${API_BASE_URL}/proof/${paymentId}/${filename}`;
};

