"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { apiService } from '@/lib/api'
import { domainVerificationService } from '@/lib/domainVerification'
import { normalizeUrl } from '@/lib/utils'

interface Website {
  _id: string
  publisherId: string
  domain: string
  url: string
  categories: string[]
  pricing: {
    guestPost?: number
    linkInsertion?: number
    writingGuestPost?: number
  }
  turnaroundTimeDays: number
  country: string
  language: string
  status: 'pending' | 'active' | 'rejected'
  ownershipVerification: {
    isVerified: boolean
    verifiedAt?: string
    verificationMethod?: string
    userRole: string
    status: string
  }
  createdAt: string
  updatedAt: string
}

interface WebsiteFormProps {
  website?: Website | null
  onSubmit: (data: any) => void
  onClose: () => void
}

const categories = [
  'technology',
  'business',
  'health',
  'finance',
  'education',
  'lifestyle',
  'travel',
  'food',
  'sports',
  'entertainment',
  'news',
  'other'
]

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
  { value: 'other', label: 'Other' }
]

export function WebsiteForm({ website, onSubmit, onClose }: WebsiteFormProps) {
  const [formData, setFormData] = useState({
    url: '',
    categories: [] as string[],
    pricing: {
      guestPost: '',
      linkInsertion: '',
      writingGuestPost: ''
    },
    turnaroundTimeDays: '',
    country: '',
    language: 'en'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [domainVerification, setDomainVerification] = useState<{
    isVerifying: boolean
    isValid: boolean | null
    error: string | null
  }>({
    isVerifying: false,
    isValid: null,
    error: null
  })


  useEffect(() => {
    if (website) {
      setFormData({
        url: website.url || '',
        categories: website.categories || [],
        pricing: {
          guestPost: website.pricing?.guestPost?.toString() || '',
          linkInsertion: website.pricing?.linkInsertion?.toString() || '',
          writingGuestPost: website.pricing?.writingGuestPost?.toString() || ''
        },
        turnaroundTimeDays: website.turnaroundTimeDays?.toString() || '',
        country: website.country || '',
        language: website.language || 'en'
      })
    }
  }, [website])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.url.trim()) {
      newErrors.url = 'Website URL is required'
    } else if (!/^https?:\/\/.+/.test(formData.url)) {
      newErrors.url = 'Please enter a valid URL starting with http:// or https://'
    } else if (domainVerification.isValid === false) {
      newErrors.url = domainVerification.error || 'Domain verification failed'
    } else if (domainVerification.isVerifying) {
      newErrors.url = 'Please wait for domain verification to complete'
    }

    if (formData.categories.length === 0) {
      newErrors.categories = 'Please select at least one category'
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required'
    }

    if (!formData.turnaroundTimeDays.trim()) {
      newErrors.turnaroundTimeDays = 'Turnaround time is required'
    } else if (isNaN(Number(formData.turnaroundTimeDays)) || Number(formData.turnaroundTimeDays) < 1) {
      newErrors.turnaroundTimeDays = 'Please enter a valid turnaround time (minimum 1 day)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const submitData = {
        url: normalizeUrl(formData.url),
        categories: formData.categories,
        pricing: {
          guestPost: formData.pricing.guestPost ? Number(formData.pricing.guestPost) : undefined,
          linkInsertion: formData.pricing.linkInsertion ? Number(formData.pricing.linkInsertion) : undefined,
          writingGuestPost: formData.pricing.writingGuestPost ? Number(formData.pricing.writingGuestPost) : undefined
        },
        turnaroundTimeDays: Number(formData.turnaroundTimeDays),
        country: formData.country,
        language: formData.language
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }

    // Verify domain when URL changes
    if (field === 'url' && value) {
      verifyDomain(value)
    }
  }

  const verifyDomain = async (url: string) => {
    if (!url) {
      setDomainVerification({ isVerifying: false, isValid: null, error: null })
      return
    }

    setDomainVerification({ isVerifying: true, isValid: null, error: null })

    try {
      const cleanDomain = domainVerificationService.cleanDomain(url)
      if (!cleanDomain) {
        setDomainVerification({
          isVerifying: false,
          isValid: false,
          error: 'Invalid domain format'
        })
        return
      }

      const result = await domainVerificationService.verifyDomain(cleanDomain)
      
      setDomainVerification({
        isVerifying: false,
        isValid: result.isValid,
        error: result.isValid ? null : result.error || 'Domain verification failed'
      })
    } catch (error: any) {
      setDomainVerification({
        isVerifying: false,
        isValid: false,
        error: error.message || 'Domain verification failed'
      })
    }
  }


  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {website ? 'Edit Website' : 'Add Website'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">Basic Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website URL *
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => handleChange('url', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.url ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } dark:bg-gray-700 dark:text-white`}
                    placeholder="https://example.com"
                  />
                  
                  {/* Domain Verification Status */}
                  {formData.url && (
                    <div className="mt-2">
                      {domainVerification.isVerifying && (
                        <div className="flex items-center text-blue-600 dark:text-blue-400">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          <span className="text-sm">Verifying domain...</span>
                        </div>
                      )}
                      
                      {domainVerification.isValid === true && (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">Domain verified successfully</span>
                        </div>
                      )}
                      
                      {domainVerification.isValid === false && (
                        <div className="flex items-center text-red-600 dark:text-red-400">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">{domainVerification.error}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {errors.url && <p className="text-red-500 text-sm mt-1">{errors.url}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categories *
                  </label>
                  <select
                    multiple
                    value={formData.categories}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      handleChange('categories', selectedOptions);
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.categories ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } dark:bg-gray-700 dark:text-white`}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                  {errors.categories && <p className="text-red-500 text-sm mt-1">{errors.categories}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.country ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } dark:bg-gray-700 dark:text-white`}
                      placeholder="e.g., United States"
                    />
                    {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Language *
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => handleChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {languages.map(lang => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing & Turnaround */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">Pricing & Turnaround</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Guest Post Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.pricing.guestPost}
                      onChange={(e) => handleChange('pricing.guestPost', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Link Insertion Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.pricing.linkInsertion}
                      onChange={(e) => handleChange('pricing.linkInsertion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Writing + Guest Post Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.pricing.writingGuestPost}
                      onChange={(e) => handleChange('pricing.writingGuestPost', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Turnaround Time (days) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.turnaroundTimeDays}
                      onChange={(e) => handleChange('turnaroundTimeDays', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.turnaroundTimeDays ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } dark:bg-gray-700 dark:text-white`}
                      placeholder="e.g., 7"
                    />
                    {errors.turnaroundTimeDays && <p className="text-red-500 text-sm mt-1">{errors.turnaroundTimeDays}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (website ? 'Update Website' : 'Add Website')}
              </Button>
            </div>
          </form>
        </div>
      </div>

    </div>
  )
}