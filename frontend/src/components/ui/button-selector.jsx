import React from 'react';
import { cn } from '../../lib/utils';

export const ButtonSelector = ({ 
  options = [], 
  value, 
  onChange, 
  label,
  className,
  disabled = false 
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all duration-200",
                "border-2 relative overflow-hidden",
                isSelected
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:border-gray-400",
                disabled && "opacity-50 cursor-not-allowed",
                !disabled && "hover:shadow-sm"
              )}
            >
              {option.label}
              {isSelected && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
