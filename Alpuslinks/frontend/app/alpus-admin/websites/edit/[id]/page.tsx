"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { apiService } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, ArrowRight, Shield, Upload, Globe, FileText, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import CustomSelect from '@/components/ui/custom-select'
import toast from 'react-hot-toast'

interface Website {
  _id: string
  publisherId: string
  domain: string
  url: string
  categories: Array<{
    _id: string
    name: string
    slug: string
  }>
  pricing: {
    guestPost?: number
    linkInsertion?: number
    writingGuestPost?: number
    extraLinks?: number
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
    verificationCode?: string
    verificationDetails?: {
      metaTagContent?: string
      fileName?: string
      dnsRecord?: string
    }
    lastAttempted?: string
    attemptCount: number
    status: string
    failureReason?: string
  }
  createdAt: string
  updatedAt: string
  meta?: {
    mozDA?: number
    ahrefsDR?: number
    semrushTraffic?: number
    googleAnalyticsTraffic?: number
    minWordCount?: number
    maxLinks?: number
    allowedTopics?: string[]
    prohibitedTopics?: string[]
    sponsored?: boolean
    email?: string
    phone?: string
    twitter?: string
    linkedin?: string
    facebook?: string
    notes?: string
  }
}

const countries = [
  { value: 'United States', label: '🇺🇸 United States' },
  { value: 'United Kingdom', label: '🇬🇧 United Kingdom' },
  { value: 'Canada', label: '🇨🇦 Canada' },
  { value: 'Australia', label: '🇦🇺 Australia' },
  { value: 'Germany', label: '🇩🇪 Germany' },
  { value: 'France', label: '🇫🇷 France' },
  { value: 'Spain', label: '🇪🇸 Spain' },
  { value: 'Italy', label: '🇮🇹 Italy' },
  { value: 'Netherlands', label: '🇳🇱 Netherlands' },
  { value: 'Sweden', label: '🇸🇪 Sweden' },
  { value: 'Norway', label: '🇳🇴 Norway' },
  { value: 'Denmark', label: '🇩🇰 Denmark' },
  { value: 'Finland', label: '🇫🇮 Finland' },
  { value: 'Japan', label: '🇯🇵 Japan' },
  { value: 'South Korea', label: '🇰🇷 South Korea' },
  { value: 'China', label: '🇨🇳 China' },
  { value: 'India', label: '🇮🇳 India' },
  { value: 'Brazil', label: '🇧🇷 Brazil' },
  { value: 'Mexico', label: '🇲🇽 Mexico' },
  { value: 'Argentina', label: '🇦🇷 Argentina' }
]

const languages = [
  { value: 'en', label: '🇺🇸 English' },
  { value: 'es', label: '🇪🇸 Spanish' },
  { value: 'fr', label: '🇫🇷 French' },
  { value: 'de', label: '🇩🇪 German' },
  { value: 'it', label: '🇮🇹 Italian' },
  { value: 'pt', label: '🇵🇹 Portuguese' },
  { value: 'ru', label: '🇷🇺 Russian' },
  { value: 'ja', label: '🇯🇵 Japanese' },
  { value: 'ko', label: '🇰🇷 Korean' },
  { value: 'zh', label: '🇨🇳 Chinese' }
]

const statusOptions = [
  { value: 'pending', label: '⏳ Pending' },
  { value: 'active', label: '✅ Active' },
  { value: 'rejected', label: '❌ Rejected' }
]

export default function EditWebsitePage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const websiteId = params.id as string
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isCheckingUrl, setIsCheckingUrl] = useState(false)
  
  // Categories state
  const [categories, setCategories] = useState<Array<{value: string, label: string}>>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  
  // Ownership verification states
  const [ownershipMethod, setOwnershipMethod] = useState<'meta' | 'file' | 'dns' | 'skip'>('meta')
  const [isVerifyingOwnership, setIsVerifyingOwnership] = useState(false)
  const [ownershipVerificationResult, setOwnershipVerificationResult] = useState<any>(null)
  const [userRole, setUserRole] = useState<'owner' | 'contributor'>('owner')
  const [metaTagContent, setMetaTagContent] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [dnsRecord, setDnsRecord] = useState('')

  // Step 1 data
  const [url, setUrl] = useState('')
  
  // Step 2 data
  const [formData, setFormData] = useState({
    categories: [] as string[],
    guestPostPrice: '',
    linkInsertionPrice: '',
    writingGuestPostPrice: '',
    extraLinksPrice: '',
    tatDays: '',
    country: '',
    language: 'en',
    minWordCount: '',
    maxLinks: '',
    status: 'pending' as string
  })
  
  const [website, setWebsite] = useState<Website | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true)
        console.log('Fetching categories...')
        const response = await apiService.getCategories()
        console.log('Categories API response:', response)
        if (response.data && (response.data as any).success) {
          const categoryData = (response.data as any).data
          console.log('Raw category data:', categoryData)
          const formattedCategories = categoryData.map((cat: any) => ({
            value: cat._id,
            label: cat.name
          }))
          console.log('Formatted categories:', formattedCategories)
          setCategories(formattedCategories)
        } else {
          console.log('Categories API response not successful:', response.data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        toast.error('Failed to load categories')
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const loadWebsite = async () => {
      if (!websiteId || !user?.id) return

      try {
        setLoading(true)
        setError(null)
        
        console.log('Loading website with ID:', websiteId)
        const response = await apiService.getWebsite(websiteId)
        console.log('Website API response:', response)
        
        if (response.data) {
          const websiteData = response.data as Website
          console.log('Website data received:', websiteData)
          setWebsite(websiteData)
          
          // Populate form data
          setUrl(websiteData.url)
          const categoryIds = websiteData.categories.map(cat => cat._id)
          console.log('Website categories from API:', websiteData.categories)
          console.log('Category IDs extracted:', categoryIds)
          console.log('Available categories in state:', categories)
          console.log('Category IDs match check:', categoryIds.map(id => 
            categories.find(cat => cat.value === id)
          ))
          
          setFormData({
            categories: categoryIds,
            guestPostPrice: websiteData.pricing?.guestPost?.toString() || '',
            linkInsertionPrice: websiteData.pricing?.linkInsertion?.toString() || '',
            writingGuestPostPrice: websiteData.pricing?.writingGuestPost?.toString() || '',
            extraLinksPrice: websiteData.pricing?.extraLinks?.toString() || '',
            tatDays: websiteData.turnaroundTimeDays?.toString() || '',
            country: websiteData.country || '',
            language: websiteData.language || 'en',
            minWordCount: websiteData.meta?.minWordCount?.toString() || '',
            maxLinks: websiteData.meta?.maxLinks?.toString() || '',
            status: websiteData.status || 'pending'
          })
          
          console.log('Form data set with categories:', categoryIds)
          
          // Set ownership verification data
          setOwnershipMethod(websiteData.ownershipVerification?.verificationMethod as any || 'meta')
          setUserRole(websiteData.ownershipVerification?.userRole as any || 'owner')
          setMetaTagContent(websiteData.ownershipVerification?.verificationDetails?.metaTagContent || '')
          setDnsRecord(websiteData.ownershipVerification?.verificationDetails?.dnsRecord || '')
        } else {
          setError('Website not found')
        }
      } catch (err) {
        console.error('Error loading website:', err)
        setError(err instanceof Error ? err.message : 'Failed to load website')
      } finally {
        setLoading(false)
      }
    }

    // Only load website after categories are loaded
    if (categories.length > 0) {
      console.log('Categories loaded, now loading website...')
      loadWebsite()
    } else {
      console.log('Categories not loaded yet, waiting...')
    }
  }, [websiteId, user?.id, categories.length])

  const handleSubmit = async () => {
    setErrors({})

    // Validation
    if (!formData.categories.length) {
      setErrors({ categories: 'Please select at least one category' })
      return
    }

    if (!formData.country) {
      setErrors({ country: 'Please select a country' })
      return
    }

    try {
      setSaving(true)
      const websiteData = {
        url,
        categories: formData.categories,
        pricing: {
          ...(formData.guestPostPrice && { guestPost: parseFloat(formData.guestPostPrice) }),
          ...(formData.linkInsertionPrice && { linkInsertion: parseFloat(formData.linkInsertionPrice) }),
          ...(formData.extraLinksPrice && { extraLinks: parseFloat(formData.extraLinksPrice) }),
          ...(formData.writingGuestPostPrice && { writingGuestPost: parseFloat(formData.writingGuestPostPrice) })
        },
        turnaroundTimeDays: parseInt(formData.tatDays) || 7,
        country: formData.country,
        language: formData.language,
        status: formData.status,
        requirements: {
          ...(formData.minWordCount && { minWordCount: parseInt(formData.minWordCount) }),
          ...(formData.maxLinks && { maxLinks: parseInt(formData.maxLinks) })
        },
        ownershipVerification: {
          method: ownershipMethod,
          verified: ownershipVerificationResult?.isVerified || false,
          role: userRole,
          ...(ownershipMethod === 'meta' && { metaTagContent }),
          ...(ownershipMethod === 'file' && { fileName: uploadedFile?.name }),
          ...(ownershipMethod === 'dns' && { dnsRecord })
        }
      }

      const response = await apiService.updateWebsite(websiteId, websiteData)
      if (response.data) {
        toast.success('Website updated successfully!')
        
        // Dispatch event to update sidebar
        window.dispatchEvent(new CustomEvent('websiteUpdated'))
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/alpus-admin/websites')
        }, 2000)
      }
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to update website' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["super admin", "admin"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading website...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !website) {
    return (
      <ProtectedRoute allowedRoles={["super admin", "admin"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Link
                  href="/alpus-admin/websites"
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mr-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Website Management
                </Link>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {error || 'Website not found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                The website you're looking for doesn't exist or you don't have permission to access it.
              </p>
              <Link
                href="/alpus-admin/websites"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Website Management
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["super admin", "admin"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Link
                href="/alpus-admin/websites"
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Website Management
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Edit Website
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Update website information for guest posting and link insertion services
            </p>
          </div>

          {/* Form Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-8">
              {/* Step 3: Set Details - Skip to details for edit */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Update Website Details
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Update the website's categories, pricing, requirements, and status.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Categories Row */}
                  <div className="flex items-start">
                    <div className="w-32 flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Categories *
                      </label>
                    </div>
                    <div className="flex-1">
                      {isLoadingCategories || !website ? (
                        <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          {isLoadingCategories ? 'Loading categories...' : 'Loading website...'}
                        </div>
                      ) : (
                        <MultiSelect
                          options={categories}
                          value={formData.categories}
                          onChange={(value) => setFormData(prev => ({ ...prev, categories: value }))}
                          placeholder="Select categories"
                          showAllAsTags={true}
                        />
                      )}
                      {errors.categories && (
                        <p className="mt-2 text-sm text-red-600">{errors.categories}</p>
                      )}
                    </div>
                  </div>

                  {/* Status Row */}
                  <div className="flex items-center">
                    <div className="w-32 flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status *
                      </label>
                    </div>
                    <div className="flex-1">
                      <CustomSelect
                        options={statusOptions}
                        value={formData.status}
                        onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                        placeholder="Select status"
                      />
                    </div>
                  </div>

                  {/* Country Row */}
                  <div className="flex items-center">
                    <div className="w-32 flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Country *
                      </label>
                    </div>
                    <div className="flex-1">
                      <CustomSelect
                        options={countries}
                        value={formData.country}
                        onChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                        placeholder="Select country"
                      />
                      {errors.country && (
                        <p className="mt-2 text-sm text-red-600">{errors.country}</p>
                      )}
                    </div>
                  </div>

                  {/* Language Row */}
                  <div className="flex items-center">
                    <div className="w-32 flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Language
                      </label>
                    </div>
                    <div className="flex-1">
                      <CustomSelect
                        options={languages}
                        value={formData.language}
                        onChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                        placeholder="Select language"
                      />
                    </div>
                  </div>

                  {/* Turnaround Time Row */}
                  <div className="flex items-center">
                    <div className="w-32 flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Turnaround Time (Days)
                      </label>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={formData.tatDays}
                        onChange={(e) => setFormData(prev => ({ ...prev, tatDays: e.target.value }))}
                        placeholder="7"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Guest Post Price Row */}
                  <div className="flex items-center">
                    <div className="w-32 flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Guest Post Price ($)
                      </label>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={formData.guestPostPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, guestPostPrice: e.target.value }))}
                        placeholder="0"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Link Insertion Price Row */}
                  <div className="flex items-center">
                    <div className="w-32 flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Link Insertion Price ($)
                      </label>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={formData.linkInsertionPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, linkInsertionPrice: e.target.value }))}
                        placeholder="0"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Extra Links Price Row */}
                  <div className="flex items-center">
                    <div className="w-32 flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Extra Links Price ($)
                      </label>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={formData.extraLinksPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, extraLinksPrice: e.target.value }))}
                        placeholder="0"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Writing + Guest Post Price Row */}
                  <div className="flex items-center">
                    <div className="w-32 flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Writing + Guest Post Price ($)
                      </label>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={formData.writingGuestPostPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, writingGuestPostPrice: e.target.value }))}
                        placeholder="0"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Minimum Word Count Row */}
                  <div className="flex items-center">
                    <div className="w-32 flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Minimum Word Count
                      </label>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={formData.minWordCount}
                        onChange={(e) => setFormData(prev => ({ ...prev, minWordCount: e.target.value }))}
                        placeholder="500"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Maximum Links Row */}
                  <div className="flex items-center">
                    <div className="w-32 flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Maximum Links
                      </label>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={formData.maxLinks}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxLinks: e.target.value }))}
                        placeholder="3"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {errors.submit}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-8 flex justify-end space-x-4">
                  <Button
                    onClick={() => router.push('/alpus-admin/websites')}
                    variant="outline"
                    className="px-6 py-3"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Update Website
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
