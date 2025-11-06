// components/Badge.jsx
import React from 'react';

const Badge = ({ className = '', text, ...props }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      {...props}
    >
      {text}
    </span>
  );
};

export default Badge;