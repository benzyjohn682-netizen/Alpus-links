"use client"

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { countries, searchCountries, type Country } from '@/lib/countries'

interface CountrySelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function CountrySelect({ 
  value, 
  onChange, 
  placeholder = "Select country",
  className = ""
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCountries, setFilteredCountries] = useState<Country[]>(countries)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Get selected country
  const selectedCountry = countries.find(country => country.value === value)

  // Filter countries based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredCountries(searchCountries(searchQuery))
    } else {
      setFilteredCountries(countries)
    }
  }, [searchQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (country: Country) => {
    onChange(country.value)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchQuery('')
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-4 py-3 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {selectedCountry ? (
              <>
                <img 
                  src={`https://flagcdn.com/24x18/${selectedCountry.code.toLowerCase()}.png`}
                  alt={`${selectedCountry.label} flag`}
                  className="w-6 h-4 mr-2 flex-shrink-0 object-cover rounded-sm"
                />
                <span className="text-gray-900 dark:text-white font-medium">{selectedCountry.label}</span>
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Countries List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.value}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center ${
                    value === country.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  <img 
                    src={`https://flagcdn.com/24x18/${country.code.toLowerCase()}.png`}
                    alt={`${country.label} flag`}
                    className="w-6 h-4 mr-3 flex-shrink-0 object-cover rounded-sm"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{country.label}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
