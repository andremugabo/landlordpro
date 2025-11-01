import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api/expenses';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// -------------------- REQUEST INTERCEPTOR --------------------
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// -------------------- RESPONSE INTERCEPTOR --------------------
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject({
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

// -------------------- HELPER FUNCTION --------------------
const toFormData = (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === 'object' && !(value instanceof Date)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
  });
  return formData;
};

// -------------------- EXPENSE API FUNCTIONS --------------------

/**
 * Get all expenses with optional pagination and filters
 */
export const getAllExpenses = async ({ 
  page = 1, 
  limit = 10, 
  propertyId = '', 
  localId = '', 
  category = '',
  paymentStatus = '',
  currency = '',
  startDate = '',
  endDate = '',
  minAmount = '',
  maxAmount = '',
  search = '',
  includeDeleted = false,
} = {}) => {
  const offset = (page - 1) * limit;
  const params = { offset, limit };
  
  if (propertyId) params.propertyId = propertyId;
  if (localId) params.localId = localId;
  if (category) params.category = category;
  if (paymentStatus) params.paymentStatus = paymentStatus;
  if (currency) params.currency = currency;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (minAmount) params.minAmount = minAmount;
  if (maxAmount) params.maxAmount = maxAmount;
  if (search) params.search = search;
  if (includeDeleted) params.includeDeleted = includeDeleted;

  const response = await axiosInstance.get('/', { params });
  return response.data; // Returns { success, data, pagination }
};

/**
 * Get a single expense by ID
 */
export const getExpenseById = async (id) => {
  const response = await axiosInstance.get(`/${id}`);
  return response.data.data;
};

/**
 * Create a new expense
 */
export const createExpense = async (formDataOrObject, isFormData = false) => {
  const payload = isFormData ? formDataOrObject : toFormData(formDataOrObject);
  const headers = { 'Content-Type': 'multipart/form-data' };
  
  const response = await axiosInstance.post('/', payload, { headers });
  return response.data.data;
};

/**
 * Update an existing expense
 */
export const updateExpense = async (id, formDataOrObject, isFormData = false) => {
  const payload = isFormData ? formDataOrObject : toFormData(formDataOrObject);
  const headers = { 'Content-Type': 'multipart/form-data' };
  
  const response = await axiosInstance.put(`/${id}`, payload, { headers });
  return response.data.data;
};

/**
 * Soft delete an expense (admin only)
 */
export const deleteExpense = async (id) => {
  const response = await axiosInstance.delete(`/${id}`);
  return response.data.message;
};

/**
 * Hard delete an expense permanently (admin only)
 */
export const hardDeleteExpense = async (id) => {
  const response = await axiosInstance.delete(`/${id}/hard`);
  return response.data.message;
};

/**
 * Restore a soft-deleted expense (admin only)
 */
export const restoreExpense = async (id) => {
  const response = await axiosInstance.patch(`/${id}/restore`);
  return response.data.data;
};

/**
 * Approve an expense (admin only)
 */
export const approveExpense = async (id, approvedBy) => {
  const response = await axiosInstance.patch(`/${id}/approve`, { approvedBy });
  return response.data.data;
};

/**
 * Get expense summary/analytics
 */
export const getExpenseSummary = async (filters = {}) => {
  const response = await axiosInstance.get('/summary', { params: filters });
  return response.data.data;
};

/**
 * Get overdue expenses
 */
export const getOverdueExpenses = async (filters = {}) => {
  const response = await axiosInstance.get('/overdue', { params: filters });
  return response.data.data;
};

/**
 * Get expenses by entity (property or local)
 */
export const getExpensesByEntity = async (entityType, entityId, filters = {}) => {
  const response = await axiosInstance.get(`/entity/${entityType}/${entityId}`, { params: filters });
  return response.data.data;
};

/**
 * Bulk update payment status for multiple expenses (admin only)
 */
export const bulkUpdatePaymentStatus = async ({ expenseIds, paymentStatus, paymentDate, paymentMethod }) => {
  const response = await axiosInstance.patch('/bulk/payment-status', {
    expenseIds,
    paymentStatus,
    paymentDate,
    paymentMethod,
  });
  return response.data;
};

/**
 * Download/preview proof file
 */
export const getProofFile = async (expenseId, filename) => {
  const response = await axiosInstance.get(`/${expenseId}/proof/${filename}`, {
    responseType: 'blob',
  });
  return response.data;
};