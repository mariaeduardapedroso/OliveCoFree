/**
 * VIEW: Select
 *
 * Componente de select reutilizável.
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Selecione uma opção',
  error,
  required = false,
  disabled = false,
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
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`
            w-full px-4 py-2 border rounded-lg outline-none transition-all duration-200
            appearance-none cursor-pointer
            ${error
              ? 'border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-gray-300 focus:ring-2 focus:ring-primary-200 focus:border-primary-500'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
        >
          <option value="">{placeholder}</option>
          {options.map((option, index) => (
            <option
              key={option.valor || index}
              value={option.valor}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          size={20}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Select;
