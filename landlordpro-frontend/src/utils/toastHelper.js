// src/utils/toastHelper.js
import { toast } from 'react-toastify';

export const showSuccess = (message, options = {}) => {
  toast.success(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    theme: 'colored',
    ...options,
  });
};

export const showError = (message, options = {}) => {
  toast.error(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    theme: 'colored',
    ...options,
  });
};

export const showInfo = (message, options = {}) => {
  toast.info(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    theme: 'colored',
    ...options,
  });
};
