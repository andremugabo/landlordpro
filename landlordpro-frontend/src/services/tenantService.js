import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api/tenants';

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

// ⚠️ Handle global 401 errors (optional redirect to login)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized: please log in.');
      localStorage.removeItem('token');
      // Optionally redirect
      // window.location.href = '/login';
    }

    const errMessage = error.response?.data?.message || 'Something went wrong';
    return Promise.reject({ message: errMessage, status: error.response?.status || 500 });
  }
);

/**
 * 📄 Get all tenants (with pagination and optional search)
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} search - Optional search term (name/email/phone)
 */
export const getAllTenants = async (page = 1, limit = 10, search = '') => {
  const params = { page, limit };
  if (search) params.search = search;

  const response = await axiosInstance.get('/', { params });
  return response.data; // { tenants, totalPages, page }
};

/**
 * 📋 Get tenant by ID
 * @param {string} id
 */
export const getTenantById = async (id) => {
  const response = await axiosInstance.get(`/${id}`);
  return response.data.tenant;
};

/**
 * ➕ Create new tenant
 * @param {object} data - { name, email, phone, company_name?, tin_number? }
 */
export const createTenant = async (data) => {
  const response = await axiosInstance.post('/', data);
  return response.data.tenant;
};

/**
 * ✏️ Update tenant
 * @param {string} id
 * @param {object} data - { name, email, phone, company_name?, tin_number? }
 */
export const updateTenant = async (id, data) => {
  const response = await axiosInstance.put(`/${id}`, data);
  return response.data.tenant;
};

/**
 * 🗑️ Soft delete tenant
 * @param {string} id
 */
export const deleteTenant = async (id) => {
  const response = await axiosInstance.delete(`/${id}`);
  return response.data.message;
};

/**
 * ♻️ Restore tenant (Admin only)
 * @param {string} id
 */
export const restoreTenant = async (id) => {
  const response = await axiosInstance.patch(`/${id}/restore`);
  return response.data.tenant;
};
