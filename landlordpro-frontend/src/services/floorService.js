import axios from 'axios';

// ✅ Base URL fallback if env variable is missing
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL) + '/api/floors';
const PROPERTIES_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL) + '/api/properties';

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

// Get floors by property ID
export const getFloorsByPropertyId = async (propertyId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${PROPERTIES_API_BASE_URL}/${propertyId}/floors`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data;
  } catch (err) {
    throw new Error(err?.message || `Failed to fetch floors for property ${propertyId}`);
  }
};

// Get floors with statistics (with optional property filter)
export const getFloorsWithStats = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/stats', { params });
    return response.data;
  } catch (err) {
    throw new Error(err?.message || 'Failed to fetch floors with statistics');
  }
};

// Get simple floor list for a property
export const getPropertyFloorsSimple = async (propertyId) => {
  try {
    const response = await axiosInstance.get(`/property/${propertyId}/simple`);
    return response.data;
  } catch (err) {
    throw new Error(err?.message || `Failed to fetch simple floors list for property ${propertyId}`);
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

// Get occupancy report for all floors (with optional property filter)
export const getAllFloorsOccupancy = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/reports/occupancy', { params });
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

// ------------------- UTILITY FUNCTIONS -------------------

// Helper to extract floors data from response
export const extractFloorsData = (response) => {
  if (!response) return [];

  if (Array.isArray(response)) return response;        
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.floors)) return response.floors; 

  // fallback
  return [];
};


// Helper to check if response is filtered by property
export const isFilteredByProperty = (response) => {
  return response?.filtered_by_property || false;
};

// Helper to get property info from floors response
export const getPropertyInfo = (response) => {
  return response?.property || null;
};