import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : 'http://localhost:3000/api';

/* ---------------------------
   🗝 Token Management
---------------------------- */
export const storeToken = (token) => localStorage.setItem('token', token);
export const getToken = () => localStorage.getItem('token');
export const clearToken = () => localStorage.removeItem('token');

/* ---------------------------
   👤 User Session Management
---------------------------- */
export const saveLoggedInUser = (user) => {
  if (!user) {
    sessionStorage.removeItem('authenticatedUser');
    localStorage.removeItem('user');
    return;
  }
  const serialised = JSON.stringify(user);
  sessionStorage.setItem('authenticatedUser', serialised);
  localStorage.setItem('user', serialised);
};

export const getLoggedInUser = () => {
  const user = sessionStorage.getItem('authenticatedUser') || localStorage.getItem('user');
  if (!user) return null;

  try {
    const parsed = JSON.parse(user);
    if (parsed?.role) {
      parsed.role = String(parsed.role).toLowerCase();
    }
    return parsed;
  } catch (error) {
    console.error('Failed to parse stored user:', error);
    return null;
  }
};

export const clearLoggedInUser = () => {
  sessionStorage.removeItem('authenticatedUser');
  localStorage.removeItem('user');
};

/* ---------------------------
   🔐 Authentication Checks
---------------------------- */
export const isUserLoggedIn = () => !!getLoggedInUser();

export const hasRole = (role) => getLoggedInUser()?.role === role;

export const logout = () => {
  clearToken();
  clearLoggedInUser();
};

/* ---------------------------
   ⚙️ Auth API Calls
---------------------------- */
export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    const { token, user } = response.data || {};
    if (token) {
      storeToken(token);
      saveLoggedInUser(user);
    }
    return response.data;
  } catch (err) {
    console.error('Login failed:', err.response?.data?.message || err.message);
    throw new Error(err.response?.data?.message || 'Login failed');
  }
};

export const registerUser = async (userObj) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userObj, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('Registration failed:', err.response?.data?.message || err.message);
    throw new Error(err.response?.data?.message || 'Registration failed');
  }
};
