import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api/floors';

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

// ------------------- CRUD -------------------

// Get all floors
export const getAllFloors = async () => {
  const response = await axiosInstance.get('/');
  return response.data;
};

// Get a single floor by ID
export const getFloorById = async (id) => {
  const response = await axiosInstance.get(`/${id}`);
  return response.data;
};

// Update a floor (PUT)
export const updateFloor = async (id, data) => {
  const response = await axiosInstance.put(`/${id}`, data);
  return response.data;
};

// Soft delete a floor
export const deleteFloor = async (id) => {
  const response = await axiosInstance.delete(`/${id}`);
  return response.data.message;
};

// ------------------- Occupancy Reports -------------------

// Get occupancy report for all floors
export const getAllFloorsOccupancy = async () => {
  const response = await axiosInstance.get('/reports/occupancy');
  return response.data;
};

// Get occupancy report for a single floor
export const getFloorOccupancy = async (id) => {
  const response = await axiosInstance.get(`/${id}/occupancy`);
  return response.data;
};
