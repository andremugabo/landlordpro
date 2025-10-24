import React from 'react';

const Checkbox = ({ label, checked, onChange, className = '' }) => {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-400"
      />
      <span className="text-gray-700 text-sm">{label}</span>
    </label>
  );
};

export default Checkbox;
