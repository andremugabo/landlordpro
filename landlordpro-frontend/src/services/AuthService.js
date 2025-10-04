import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// --- Login ---
export const loginUser = async (email, password) => {
  const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
  if (response.data?.token) {
    storeToken(response.data.token);
    saveLoggedInUser(response.data.user);
  }
  return response.data;
};

// --- Register User (admin-only) ---
export const registerUser = async (userObj) => {
  const token = getToken();
  return axios.post(`${API_BASE_URL}/register`, userObj, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// --- Token Management ---
export const storeToken = (token) => localStorage.setItem('token', token);
export const getToken = () => localStorage.getItem('token');
export const clearToken = () => localStorage.removeItem('token');

// --- User Session ---
export const saveLoggedInUser = (user) => sessionStorage.setItem('authenticatedUser', JSON.stringify(user));
export const getLoggedInUser = () => {
  const user = sessionStorage.getItem('authenticatedUser');
  return user ? JSON.parse(user) : null;
};
export const clearLoggedInUser = () => sessionStorage.removeItem('authenticatedUser');

// --- Role Checks ---
export const hasRole = (role) => getLoggedInUser()?.role === role;

// --- Authentication Checks ---
export const isUserLoggedIn = () => !!getLoggedInUser();

// --- Logout ---
export const logout = () => {
  clearToken();
  clearLoggedInUser();
};
