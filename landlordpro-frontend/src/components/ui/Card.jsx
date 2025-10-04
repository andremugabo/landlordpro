import React from 'react';

const Card = ({ children, className = '', variant = 'default' }) => {
  const variants = {
    default: 'p-4 shadow-sm',
    elevated: 'p-6 shadow-md',
    flat: 'p-4 border-none',
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default Card;