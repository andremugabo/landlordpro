import React from 'react';
import ReactSelect from 'react-select';

const Select = ({ 
  label, 
  value, 
  options, 
  onChange,
  placeholder = 'Select...',
  isSearchable = true,
  isClearable = false,
  isDisabled = false,
  isMulti = false,
  required = false,
  error = '',
  className = '',
  ...props 
}) => {
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: error ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
      '&:hover': {
        borderColor: error ? '#ef4444' : '#3b82f6',
      },
      minHeight: '42px',
      backgroundColor: isDisabled ? '#f3f4f6' : '#ffffff',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#3b82f6' 
        : state.isFocused 
        ? '#dbeafe' 
        : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      cursor: 'pointer',
      padding: '10px 12px',
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
    }),
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <ReactSelect
        value={value}
        options={options}
        onChange={onChange}
        placeholder={placeholder}
        isSearchable={isSearchable}
        isClearable={isClearable}
        isDisabled={isDisabled}
        isMulti={isMulti}
        styles={customStyles}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};


export default Select