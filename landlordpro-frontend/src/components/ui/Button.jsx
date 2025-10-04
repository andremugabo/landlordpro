import React from 'react';

const Button = ({ children, variant = 'primary', className = '', disabled = false, ...props }) => {
  const baseStyles = 'w-full px-4 py-3 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-blue-500',
    google: 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-red-500',
    facebook: 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-blue-800',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;