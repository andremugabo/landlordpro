import axios from 'axios';
import { getToken } from './AuthService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

// --- Users ---
// Fetch all users (admin-only) with pagination
export const getAllUsers = async (page = 1, limit = 10) => {
  const token = getToken();
  const response = await axios.get(`${API_BASE_URL}/api/users?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const { count, rows } = response.data;
  const totalPages = Math.ceil(count / limit);

  return {
    users: rows,
    totalPages,
    page,
  };
};


export const updateUser = async (id, userObj) => {
  const response = await axios.put(`${API_BASE_URL}/api/users/${id}`, userObj, authHeader());
  return response.data;
};

export const disableUser = async (id) => {
  const response = await axios.put(`${API_BASE_URL}/api/users/${id}/disable`, null, authHeader());
  return response.data;
};

export const enableUser = async (id) => {
  const response = await axios.put(`${API_BASE_URL}/api/users/${id}/enable`, null, authHeader());
  return response.data;
};

// --- Notifications ---
export const getNotifications = async (page = 1, limit = 10) => {
  const response = await axios.get(`${API_BASE_URL}/api/notifications?page=${page}&limit=${limit}`, authHeader());
  return response.data;
};

export const getUnreadNotifications = async (page = 1, limit = 10) => {
  const response = await axios.get(`${API_BASE_URL}/api/notifications/unread?page=${page}&limit=${limit}`, authHeader());
  return response.data;
};

export const markNotificationRead = async (id) => {
  await axios.put(`${API_BASE_URL}/api/notifications/${id}/read`, null, authHeader());
};

export const getAllNotifications = async (page = 1, limit = 10) => {
  const response = await axios.get(`${API_BASE_URL}/api/notifications/all?page=${page}&limit=${limit}`, authHeader());
  return response.data;
};

// --- Admin Registration ---
export const registerUser = async (userObj) => {
  const response = await axios.post(`${API_BASE_URL}/api/register`, userObj, authHeader());
  return response.data;
};
