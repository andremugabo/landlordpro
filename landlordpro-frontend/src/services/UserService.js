// src/services/userService.js
import axios from 'axios';
import { getToken } from './AuthService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api'|| '/api';

/* Axios instance configured once */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/* Attach token automatically */
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/* Centralized error handler */
const handleRequest = async (promise) => {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || 'Something went wrong';
    console.error('API Error:', message);
    throw new Error(message);
  }
};

/* =======================
   👥 USERS (admin only)
   ======================= */

export const getAllUsers = async (page = 1, limit = 10) => {
  const data = await handleRequest(
    api.get(`/users?page=${page}&limit=${limit}`)
  );
  const { count, rows } = data;
  return {
    users: rows,
    totalPages: Math.ceil(count / limit),
    page,
  };
};

export const updateUser = (id, userObj) =>
  handleRequest(api.put(`/users/${id}`, userObj));

export const disableUser = (id) =>
  handleRequest(api.put(`/users/${id}/disable`));

export const enableUser = (id) =>
  handleRequest(api.put(`/users/${id}/enable`));

export const registerUser = (userObj) =>
  handleRequest(api.post('/auth/register', userObj));

/* =======================
   🔔 NOTIFICATIONS
   ======================= */

export const getNotifications = (page = 1, limit = 10) =>
  handleRequest(api.get(`/notifications?page=${page}&limit=${limit}`));

export const getUnreadNotifications = (page = 1, limit = 10) =>
  handleRequest(api.get(`/notifications/unread?page=${page}&limit=${limit}`));

export const markNotificationRead = (id) =>
  handleRequest(api.put(`/notifications/${id}/read`));

export const getAllNotifications = (page = 1, limit = 10) =>
  handleRequest(api.get(`/notifications/all?page=${page}&limit=${limit}`));

/* =======================
   👤 PROFILE
   ======================= */

export const getProfile = () => handleRequest(api.get('/profile'));

export const updateProfile = (data) =>
  handleRequest(api.put('/profile', data));

/* =======================
   📁 OPTIONAL: FILE UPLOADS
   ======================= */
// Example for avatar upload
export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return handleRequest(
    api.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  );
};
