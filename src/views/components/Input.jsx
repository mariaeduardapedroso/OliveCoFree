/**
 * VIEW: Input
 *
 * Componente de input reutilizável.
 */

import React from 'react';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  icone,
  className = ''
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icone && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icone}
          </span>
        )}
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            w-full px-4 py-2 border rounded-lg outline-none transition-all duration-200
            ${icone ? 'pl-10' : ''}
            ${error
              ? 'border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-gray-300 focus:ring-2 focus:ring-primary-200 focus:border-primary-500'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Input;
