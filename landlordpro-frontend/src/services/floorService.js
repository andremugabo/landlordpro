import axios from 'axios';

// ✅ Base URL fallback if env variable is missing
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api/floors';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ------------------- INTERCEPTORS -------------------

// Add token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response handling
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

// ------------------- CRUD -------------------

// Get all floors (with optional pagination & filters)
export const getAllFloors = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/', { params });
    return response.data; // Should include items, totalPages, etc.
  } catch (err) {
    throw new Error(err?.message || 'Failed to fetch floors');
  }
};

// Get single floor
export const getFloorById = async (id) => {
  try {
    const response = await axiosInstance.get(`/${id}`);
    return response.data;
  } catch (err) {
    throw new Error(err?.message || `Failed to fetch floor with ID ${id}`);
  }
};

// Create a new floor
export const createFloor = async (data) => {
  try {
    const response = await axiosInstance.post('/', data);
    return response.data;
  } catch (err) {
    throw new Error(err?.message || 'Failed to create floor');
  }
};

// Update a floor
export const updateFloor = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/${id}`, data);
    return response.data;
  } catch (err) {
    throw new Error(err?.message || `Failed to update floor with ID ${id}`);
  }
};

// Soft delete a floor
export const deleteFloor = async (id) => {
  try {
    const response = await axiosInstance.delete(`/${id}`);
    return response.data; // Keep consistent with other CRUD
  } catch (err) {
    throw new Error(err?.message || `Failed to delete floor with ID ${id}`);
  }
};

// ------------------- OCCUPANCY REPORTS -------------------

// Get occupancy report for all floors
export const getAllFloorsOccupancy = async () => {
  try {
    const response = await axiosInstance.get('/reports/occupancy');
    return response.data;
  } catch (err) {
    throw new Error(err?.message || 'Failed to fetch floors occupancy report');
  }
};

// Get occupancy report for single floor
export const getFloorOccupancy = async (id) => {
  try {
    const response = await axiosInstance.get(`/${id}/occupancy`);
    return response.data;
  } catch (err) {
    throw new Error(err?.message || `Failed to fetch occupancy report for floor ${id}`);
  }
};
