import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api/expenses';

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

// Get expenses with optional pagination and filters
export const getAllExpenses = async ({ page = 1, limit = 10, propertyId = '', localId = '' } = {}) => {
  const params = { page, limit };
  if (propertyId) params.propertyId = propertyId;
  if (localId) params.localId = localId;

  const response = await axiosInstance.get('/', { params });
  return response.data;
};

// Create, update, delete remain unchanged
export const createExpense = async (data) => {
  const response = await axiosInstance.post('/', data);
  return response.data.expense;
};

export const updateExpense = async (id, data) => {
  const response = await axiosInstance.put(`/${id}`, data);
  return response.data.expense;
};

export const deleteExpense = async (id) => {
  const response = await axiosInstance.delete(`/${id}`);
  return response.data.message;
};
