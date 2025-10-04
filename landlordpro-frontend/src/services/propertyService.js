import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api/properties';

// Create an Axios instance with interceptors
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // adjust if you store token elsewhere
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized: please log in.');
      // Optional: redirect to login page
      // window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// API functions

export const getAllProperties = async (page = 1, limit = 10) => {
  const response = await axiosInstance.get('/', { params: { page, limit } });
  return response.data;
};

export const getPropertyById = async (id) => {
  const response = await axiosInstance.get(`/${id}`);
  return response.data.property;
};

export const createProperty = async (data) => {
  const response = await axiosInstance.post('/', data);
  return response.data.property;
};

export const updateProperty = async (id, data) => {
  const response = await axiosInstance.put(`/${id}`, data);
  return response.data.property;
};

export const deleteProperty = async (id) => {
  const response = await axiosInstance.delete(`/${id}`);
  return response.data.message;
};
