"use client"
import { useState } from 'react'

interface SimpleSelectOption {
  value: string
  label: string
}

interface SimpleSelectProps {
  value: string
  onChange: (value: string) => void
  options: SimpleSelectOption[]
  placeholder?: string
  className?: string
}

export function SimpleSelect({ value, onChange, options, placeholder = "Select an option", className = "" }: SimpleSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(option => option.value === value)

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Select Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
      >
        <span className="block truncate text-sm text-gray-900 dark:text-white">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg 
            className={`h-5 w-5 text-gray-400 transition-all duration-300 ease-in-out ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
          <div className="py-1 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${
                  option.value === value 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                <span className="block truncate text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
