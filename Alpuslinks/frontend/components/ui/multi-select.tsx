"use client"
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  showAllAsTags?: boolean // New prop to control display mode
}

export function MultiSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select options...",
  className = "",
  showAllAsTags = false
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedOptions = options.filter(option => value.includes(option.value))
  
  // Debug logging
  console.log('MultiSelect - selectedOptions calculated:', {
    options: options.length,
    value: value,
    selected: selectedOptions.length,
    selectedNames: selectedOptions.map(s => s.label)
  })
  
  // Debug logging
  console.log('MultiSelect Debug:', {
    optionsCount: options.length,
    valueCount: value.length,
    selectedOptionsCount: selectedOptions.length,
    value: value,
    selectedOptions: selectedOptions.map(o => ({ value: o.value, label: o.label }))
  })

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const handleRemove = (optionValue: string) => {
    console.log('handleRemove called with:', optionValue)
    console.log('Current value before removal:', value)
    const newValue = value.filter(v => v !== optionValue)
    console.log('New value after removal:', newValue)
    onChange(newValue)
  }

  const handleSelectAll = () => {
    if (value.length === filteredOptions.length) {
      onChange([])
    } else {
      onChange(filteredOptions.map(option => option.value))
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 cursor-pointer"
        onClick={(e) => {
          // Only open dropdown if clicking on the container itself, not on tags or buttons
          if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.category-tag')) {
            return
          }
          setIsOpen(!isOpen)
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1 min-h-[20px] w-full">
            {showAllAsTags ? (
              // Show only selected options as tags (for edit page)
              selectedOptions.length > 0 ? (
                selectedOptions.map(option => (
                  <span
                    key={option.value}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-500 text-white rounded-md mr-1 mb-1"
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(option.value)
                      }}
                      className="ml-1 hover:text-gray-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
              )
            ) : (
              // Show only selected options as tags (for create page)
              selectedOptions.length > 0 ? (
                selectedOptions.map(option => (
                  <span
                    key={option.value}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-200 text-blue-900 rounded-md"
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(option.value)
                      }}
                      className="ml-1 hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
              )
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200 dark:border-gray-600">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            <div className="p-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelectAll()
                }}
                className="w-full text-left px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              >
                {value.length === filteredOptions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            {filteredOptions.map(option => (
              <label
                key={option.value}
                className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  onChange={() => handleToggle(option.value)}
                  className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900 dark:text-white">{option.label}</span>
              </label>
            ))}
            
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No categories found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
