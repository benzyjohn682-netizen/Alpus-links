"use client"
import React from 'react'

interface BeautifulSelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string; icon?: string }>
  placeholder?: string
  className?: string
  label?: string
}

export function BeautifulSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select an option",
  className = "",
  label
}: BeautifulSelectProps) {
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-4 pr-12 py-4 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none cursor-pointer transition-all duration-200 hover:border-blue-600 hover:shadow-md font-medium"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.icon && `${option.icon} `}{option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </div>
      
      {/* Custom styling for enhanced appearance */}
      <style jsx>{`
        select:focus {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        select option {
          padding: 8px 12px;
          background: white;
          color: #374151;
        }
        
        select option:hover {
          background: #f3f4f6;
        }
        
        select option:checked {
          background: #3b82f6;
          color: white;
        }
        
        /* Dark mode option styling */
        @media (prefers-color-scheme: dark) {
          select option {
            background: #1f2937;
            color: #f9fafb;
          }
          
          select option:hover {
            background: #374151;
          }
          
          select option:checked {
            background: #3b82f6;
            color: white;
          }
        }
      `}</style>
    </div>
  )
}
