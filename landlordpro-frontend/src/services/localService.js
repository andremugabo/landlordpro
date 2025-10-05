import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api/locals';

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

// Get all locals (with optional property filter)
export const getAllLocals = async (page = 1, limit = 10, propertyId = null) => {
  const params = { page, limit };
  if (propertyId) params.propertyId = propertyId;
  const response = await axiosInstance.get('/', { params });
  return response.data;
};

// Get a single local by ID
export const getLocalById = async (id) => {
  const response = await axiosInstance.get(`/${id}`);
  return response.data.local;
};

// Create a new local
export const createLocal = async (data) => {
  const response = await axiosInstance.post('/', data);
  return response.data.local;
};

// Full update (PUT)
export const updateLocal = async (id, data) => {
  const response = await axiosInstance.put(`/${id}`, data);
  return response.data.local;
};

// Partial update (PATCH)
export const patchLocal = async (id, data) => {
  const response = await axiosInstance.patch(`/${id}`, data);
  return response.data.local;
};

// Update only status
export const updateLocalStatus = async (id, status) => {
  const response = await axiosInstance.patch(`/${id}/status`, { status });
  return response.data.local;
};

// Soft delete
export const softDeleteLocal = async (id) => {
  const response = await axiosInstance.delete(`/${id}`);
  return response.data.message;
};

// Restore soft-deleted local (Admin only)
export const restoreLocal = async (id) => {
  const response = await axiosInstance.patch(`/${id}/restore`);
  return response.data.local;
};
