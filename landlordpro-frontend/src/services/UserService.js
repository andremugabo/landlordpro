// src/services/userService.js
import axios from 'axios';
import { getToken } from './AuthService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : 'http://localhost:3000/api';

/* ----------------------------------------
   ⚙️ Axios Instance
---------------------------------------- */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

/* ----------------------------------------
   🔐 Attach Token Automatically
---------------------------------------- */
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/* ----------------------------------------
   ⚠️ Centralized Error Handler
---------------------------------------- */
const handleRequest = async (promise, customErrorMsg = null) => {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    const message =
      err.response?.data?.message ||
      customErrorMsg ||
      `Request failed${status ? ` (HTTP ${status})` : ''}`;

    console.error('API Error:', message, err.response?.data || err.message);
    throw new Error(message);
  }
};

/* ================================
   👥 USER MANAGEMENT
================================ */
export const getAllUsers = async (page = 1, limit = 10) => {
  const data = await handleRequest(api.get(`/users?page=${page}&limit=${limit}`));
  return {
    users: data.rows || [],
    total: data.count || 0,
    totalPages: Math.ceil((data.count || 0) / limit),
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

/* ================================
   👤 PROFILE
================================ */
export const getProfile = () => handleRequest(api.get('/profile'));

// Update profile with only the fields backend expects
export const updateProfile = (data) =>
  handleRequest(api.put('/profile', data));

// Update password
export const updatePassword = (payload) =>
  handleRequest(api.put('/profile/password', payload));

// Upload avatar/profile picture
export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);

  return handleRequest(
    api.put('/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  );
};

/* ================================
   🔔 NOTIFICATIONS
================================ */
export const getNotifications = (page = 1, limit = 10) =>
  handleRequest(api.get(`/notifications?page=${page}&limit=${limit}`));

export const getUnreadNotifications = (page = 1, limit = 10) =>
  handleRequest(api.get(`/notifications/unread?page=${page}&limit=${limit}`));

export const markNotificationRead = (id) =>
  handleRequest(api.put(`/notifications/${id}/read`));

/* ================================
   🔑 AUTH (Login/Register)
================================ */
export const loginUser = (email, password) =>
  handleRequest(api.post('/auth/login', { email, password }));

export const getAllManagers = async () => {
  const { users } = await getAllUsers(1, 1000);
  return users.filter(user => user.role === 'manager' && user.is_active);
};
