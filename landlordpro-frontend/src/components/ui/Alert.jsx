// ============================================
// components/Alert.jsx
// ============================================
import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiXCircle } from 'react-icons/fi';

const Alert = ({ 
  type = 'info', 
  message, 
  title,
  onClose,
  className = '',
}) => {
  const types = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <FiCheckCircle className="text-green-500" size={20} />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <FiXCircle className="text-red-500" size={20} />,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: <FiAlertCircle className="text-yellow-500" size={20} />,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <FiInfo className="text-blue-500" size={20} />,
    },
  };

  const style = types[type] || types.info;

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{style.icon}</div>
        <div className="flex-1">
          {title && (
            <h3 className={`font-semibold ${style.text} mb-1`}>{title}</h3>
          )}
          <p className={`text-sm ${style.text}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${style.text} hover:opacity-70`}
          >
            <FiXCircle size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;