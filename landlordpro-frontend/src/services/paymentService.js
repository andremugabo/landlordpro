import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api/payments';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) console.error('Unauthorized: please log in.');
    return Promise.reject(error.response?.data || error);
  }
);

// Get all payments with optional search
export const getAllPayments = async (term = '') => {
  const params = {};
  if (term) params.term = term;
  const response = await axiosInstance.get('/', { params });
  return response.data.payments;
};

// Get single payment by ID
export const getPaymentById = async (id) => {
  const response = await axiosInstance.get(`/${id}`);
  return response.data.payment;
};

// Create a new payment with optional proof file
export const createPayment = async (data) => {
  const formData = new FormData();
  formData.append('amount', data.amount);
  formData.append('leaseId', data.leaseId);
  formData.append('paymentModeId', data.paymentModeId);
  if (data.proof) formData.append('proof', data.proof);

  const response = await axiosInstance.post('/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.payment;
};

// Soft delete payment
export const softDeletePayment = async (id) => {
  const response = await axiosInstance.delete(`/${id}`);
  return response.data.message;
};

// Restore soft-deleted payment (Admin only)
export const restorePayment = async (id) => {
  const response = await axiosInstance.patch(`/${id}/restore`);
  return response.data.payment;
};

// Get proof file URL
export const getPaymentProofUrl = (paymentId, filename) => {
  return `${API_BASE_URL}/proof/${paymentId}/${filename}`;
};
