import axios from 'axios';
import { showSuccess, showError } from '../utils/toastHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api/properties';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
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
    if (error.response?.status === 401) showError('Unauthorized. Please log in.');
    return Promise.reject(error.response?.data || error);
  }
);

// ================= API FUNCTIONS ================= //

export const getAllProperties = async (page = 1, limit = 10) => {
  try {
    const { data } = await axiosInstance.get('/', { params: { page, limit } });
    return data;
  } catch (err) {
    showError(err.message || 'Failed to fetch properties.');
    throw err;
  }
};

export const getPropertyById = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/${id}`);
    return data.property;
  } catch (err) {
    showError(err.message || 'Property not found.');
    throw err;
  }
};

export const createProperty = async (propertyData, refreshCallback) => {
  try {
    const { data } = await axiosInstance.post('/', propertyData);
    showSuccess(data.message || 'Property created successfully.');
    if (refreshCallback) refreshCallback(); // Trigger UI refresh
    return { property: data.property, floors: data.floors };
  } catch (err) {
    showError(err.message || 'Failed to create property.');
    throw err;
  }
};

export const updateProperty = async (id, propertyData, refreshCallback) => {
  try {
    const { data } = await axiosInstance.put(`/${id}`, propertyData);
    showSuccess('Property updated successfully.');
    if (refreshCallback) refreshCallback();
    return data.property;
  } catch (err) {
    showError(err.message || 'Failed to update property.');
    throw err;
  }
};

export const deleteProperty = async (id, refreshCallback) => {
  try {
    const { data } = await axiosInstance.delete(`/${id}`);
    showSuccess(data.message || 'Property deleted successfully.');
    if (refreshCallback) refreshCallback();
    return data;
  } catch (err) {
    showError(err.message || 'Failed to delete property.');
    throw err;
  }
};
