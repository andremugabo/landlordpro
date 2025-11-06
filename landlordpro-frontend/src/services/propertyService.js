import axios from 'axios';
import { showSuccess, showError } from '../utils/toastHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api/properties';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
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

// Global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      showError('Request timeout. Please try again.');
    } else if (!error.response) {
      showError('Network error. Please check your connection.');
    } else if (error.response?.status === 401) {
      showError('Unauthorized. Please log in.');
      // Optional: Redirect to login page
      // window.location.href = '/login';
    } else if (error.response?.status === 403) {
      showError('Access denied.');
    } else if (error.response?.status === 404) {
      showError('Resource not found.');
    } else if (error.response?.status >= 500) {
      showError('Server error. Please try again later.');
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

// ================= API FUNCTIONS ================= //

// Get all properties with pagination
export const getAllProperties = async (page = 1, limit = 10) => {
  try {
    const { data } = await axiosInstance.get('/', { params: { page, limit } });
    
    // Handle different possible response structures
    if (data.data && Array.isArray(data.data.properties)) {
      // Structure: { data: { properties: [], totalPages, page } }
      return {
        properties: data.data.properties || [],
        totalPages: data.data.totalPages || 1,
        page: data.data.page || page
      };
    } else if (data.data && Array.isArray(data.data)) {
      // Structure: { data: [] } with pagination in root
      return {
        properties: data.data,
        totalPages: data.pagination?.totalPages || data.totalPages || 1,
        page: data.pagination?.page || data.page || page
      };
    } else if (Array.isArray(data.data)) {
      // Structure: { data: [] }
      return {
        properties: data.data,
        totalPages: 1,
        page: page
      };
    } else if (Array.isArray(data)) {
      // Structure: [] (direct array)
      return {
        properties: data,
        totalPages: 1,
        page: page
      };
    } else {
      // Fallback - ensure we always return the expected structure
      console.warn('Unexpected API response structure:', data);
      return {
        properties: [],
        totalPages: 1,
        page: page
      };
    }
  } catch (err) {
    console.error('getAllProperties error:', err);
    showError(err.message || 'Failed to fetch properties.');
    // Return safe fallback instead of throwing to prevent page crashes
    return {
      properties: [],
      totalPages: 1,
      page: page
    };
  }
};

// Get a property by ID
export const getPropertyById = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/${id}`);
    return data.data || null;
  } catch (err) {
    console.error('getPropertyById error:', err);
    showError(err.message || 'Property not found.');
    throw err;
  }
};

// Create a new property
export const createProperty = async (propertyData, refreshCallback) => {
  try {
    const { data } = await axiosInstance.post('/', propertyData);
    showSuccess(data.message || 'Property created successfully.');
    if (refreshCallback && typeof refreshCallback === 'function') {
      refreshCallback();
    }
    return data.data || null;
  } catch (err) {
    console.error('createProperty error:', err);
    showError(err.message || 'Failed to create property.');
    throw err;
  }
};

// Update a property
export const updateProperty = async (id, propertyData, refreshCallback) => {
  try {
    const { data } = await axiosInstance.put(`/${id}`, propertyData);
    showSuccess(data.message || 'Property updated successfully.');
    if (refreshCallback && typeof refreshCallback === 'function') {
      refreshCallback();
    }
    return data.data || null;
  } catch (err) {
    console.error('updateProperty error:', err);
    showError(err.message || 'Failed to update property.');
    throw err;
  }
};

// Delete (soft delete) a property
export const deleteProperty = async (id, refreshCallback) => {
  try {
    const { data } = await axiosInstance.delete(`/${id}`);
    showSuccess(data.message || 'Property deleted successfully.');
    if (refreshCallback && typeof refreshCallback === 'function') {
      refreshCallback();
    }
    return data || null;
  } catch (err) {
    console.error('deleteProperty error:', err);
    showError(err.message || 'Failed to delete property.');
    throw err;
  }
};

// ================= Floors ================= //

// Get all floors for a property
export const getFloorsByPropertyId = async (propertyId) => {
  try {
    const { data } = await axiosInstance.get(`/${propertyId}/floors`);
    
    // Handle different response structures for floors
    if (Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data.data?.floors)) {
      return data.data.floors;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      console.warn('Unexpected floors response structure:', data);
      return [];
    }
  } catch (err) {
    console.error('getFloorsByPropertyId error:', err);
    showError(err.message || 'Failed to fetch floors.');
    return []; // Return empty array instead of throwing
  }
};

// ================= Locals ================= //

// Get all locals for a property
export const getLocalsByPropertyId = async (propertyId) => {
  try {
    const { data } = await axiosInstance.get(`/${propertyId}/locals`);
    
    // Handle different response structures for locals
    if (Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data.data?.locals)) {
      return data.data.locals;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      console.warn('Unexpected locals response structure:', data);
      return [];
    }
  } catch (err) {
    console.error('getLocalsByPropertyId error:', err);
    showError(err.message || 'Failed to fetch locals.');
    return []; // Return empty array instead of throwing
  }
};

// Utility function to debug API responses
export const debugApiResponse = (response, endpoint) => {
  console.log(`API Response from ${endpoint}:`, response);
  return response;
};