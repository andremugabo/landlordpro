import React from 'react';

const Select = ({ label, value, options = [], onChange, className = '' }) => {
  const handleChange = (e) => {
    const selectedValue = e.target.value;
    const selectedOption = options.find(opt => opt.value === selectedValue);
    
    // Pass the full option object
    onChange(selectedOption);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label className="mb-1 text-sm font-medium text-gray-700">{label}</label>}
      <select
        value={value?.value || value || ''}
        onChange={handleChange}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;