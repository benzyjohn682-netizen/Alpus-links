"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { verifyUrl } from '@/lib/urlVerification'
import { apiService } from '@/lib/api'
import { normalizeUrl } from '@/lib/utils'
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Shield, Upload, Globe, FileText, User } from 'lucide-react'
import toast from 'react-hot-toast'

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

interface UrlCheckResult {
  isRegistered: boolean
  isArchived?: boolean
  isOtherPublisher?: boolean
  isOwnWebsite?: boolean
  message: string
  existingWebsite?: {
    id: string
    domain: string
    status: string
    publisherId: string
  }
}

interface TwoStepWebsiteFormProps {
  website?: Website | null
  onSubmit: (data: any) => void
  onClose: () => void
}

const blogCategories = [
  { value: 'technology', label: 'Technology' },
  { value: 'business', label: 'Business' },
  { value: 'health', label: 'Health' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'travel', label: 'Travel' },
  { value: 'food', label: 'Food' },
  { value: 'sports', label: 'Sports' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'news', label: 'News' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'parenting', label: 'Parenting' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'photography', label: 'Photography' },
  { value: 'music', label: 'Music' },
  { value: 'art', label: 'Art & Design' }
]

export function TwoStepWebsiteForm({ website, onSubmit, onClose }: TwoStepWebsiteFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [urlCheckResult, setUrlCheckResult] = useState<UrlCheckResult | null>(null)
  const [isCheckingUrl, setIsCheckingUrl] = useState(false)
  
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
    tatDays: '',
    country: '',
    language: 'en'
  })

  // Populate form when editing
  useEffect(() => {
    if (website) {
      setFormData({
        categories: website.categories || [],
        guestPostPrice: website.pricing?.guestPost?.toString() || '',
        linkInsertionPrice: website.pricing?.linkInsertion?.toString() || '',
        writingGuestPostPrice: website.pricing?.writingGuestPost?.toString() || '',
        tatDays: website.turnaroundTimeDays?.toString() || '',
        country: website.country || '',
        language: website.language || 'en'
      })
      setUrl(website.url || '')
      setCurrentStep(2) // Skip URL verification for editing
    }
  }, [website])

  const handleStep1Next = async () => {
    if (!url.trim()) {
      setErrors({ url: 'Please enter a website URL' })
      return
    }

    // Normalize the URL before processing
    const normalizedUrl = normalizeUrl(url)
    setUrl(normalizedUrl) // Update the input field with normalized URL

    setIsVerifying(true)
    setIsCheckingUrl(true)
    setErrors({})
    setUrlCheckResult(null)

    try {
      // First check if URL is already registered
      const urlCheck = await apiService.checkWebsiteUrl(normalizedUrl)
      
      if (urlCheck.data && typeof urlCheck.data === 'object' && 'isRegistered' in urlCheck.data && urlCheck.data.isRegistered) {
        setUrlCheckResult(urlCheck.data as UrlCheckResult)
        setErrors({ url: (urlCheck.data as UrlCheckResult).message })
        return
      }

      // If URL is available, proceed with verification
      const result = await verifyUrl(normalizedUrl)
      setVerificationResult(result)

      if (result.isValid) {
        setCurrentStep(2) // Move to ownership verification step
      } else {
        setErrors({ url: result.error || 'URL verification failed' })
      }
    } catch (error) {
      setErrors({ url: 'Failed to verify URL. Please try again.' })
    } finally {
      setIsVerifying(false)
      setIsCheckingUrl(false)
    }
  }

  const handleOwnershipVerification = async () => {
    if (userRole === 'contributor') {
      setCurrentStep(3) // Skip to final step
      return
    }

    setIsVerifyingOwnership(true)
    setErrors({})

    try {
      let verificationData: any = {
        method: ownershipMethod,
        url: normalizeUrl(url)
      }

      if (ownershipMethod === 'meta') {
        verificationData.metaTag = metaTagContent
      } else if (ownershipMethod === 'file') {
        if (!uploadedFile) {
          setErrors({ ownership: 'Please upload a verification file' })
          return
        }
        verificationData.file = uploadedFile
      } else if (ownershipMethod === 'dns') {
        verificationData.dnsRecord = dnsRecord
      }

      // Call backend API to verify ownership
      const result = await apiService.verifyWebsiteOwnership(verificationData)
      
      if (result.data && (result.data as any).verified) {
        setOwnershipVerificationResult(result.data)
        setCurrentStep(3) // Move to final step
      } else {
        setErrors({ ownership: (result.data as any)?.message || 'Ownership verification failed' })
      }
    } catch (error) {
      setErrors({ ownership: 'Failed to verify ownership. Please try again.' })
    } finally {
      setIsVerifyingOwnership(false)
    }
  }

  const handleStep2Save = async () => {
    const newErrors: Record<string, string> = {}

    // Pricing validation: at least ONE of the three must be provided; validate only fields that are filled
    const hasGP = !!formData.guestPostPrice.trim()
    const hasLI = !!formData.linkInsertionPrice.trim()
    const hasWGP = !!formData.writingGuestPostPrice.trim()

    if (!hasGP && !hasLI && !hasWGP) {
      newErrors.guestPostPrice = 'Enter at least one price'
      newErrors.linkInsertionPrice = 'Enter at least one price'
      newErrors.writingGuestPostPrice = 'Enter at least one price'
    }

    if (hasGP && (isNaN(Number(formData.guestPostPrice)) || Number(formData.guestPostPrice) < 0)) {
      newErrors.guestPostPrice = 'Please enter a valid price'
    }
    if (hasLI && (isNaN(Number(formData.linkInsertionPrice)) || Number(formData.linkInsertionPrice) < 0)) {
      newErrors.linkInsertionPrice = 'Please enter a valid price'
    }
    if (hasWGP && (isNaN(Number(formData.writingGuestPostPrice)) || Number(formData.writingGuestPostPrice) < 0)) {
      newErrors.writingGuestPostPrice = 'Please enter a valid price'
    }

    if (!formData.tatDays.trim()) {
      newErrors.tatDays = 'Turnaround time is required'
    } else if (isNaN(Number(formData.tatDays)) || Number(formData.tatDays) < 1) {
      newErrors.tatDays = 'Enter days >= 1'
    }

    if (formData.categories.length === 0) {
      newErrors.categories = 'Please select at least one category'
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Please enter a country'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      const pricing: any = {}
      if (hasGP) pricing.guestPost = Number(formData.guestPostPrice)
      if (hasLI) pricing.linkInsertion = Number(formData.linkInsertionPrice)
      if (hasWGP) pricing.writingGuestPost = Number(formData.writingGuestPostPrice)

      const websiteData = {
        url: normalizeUrl(url), // Ensure URL is normalized before submission
        categories: formData.categories, // Store all selected categories
        pricing,
        turnaroundTimeDays: Number(formData.tatDays),
        country: formData.country,
        language: formData.language,
        ownershipVerification: {
          method: ownershipMethod,
          verified: userRole === 'contributor' || (ownershipVerificationResult?.verified === true),
          role: userRole
        }
      }

      console.log('Submitting website data:', websiteData)
      
            try {
              await onSubmit(websiteData)
            } catch (error) {
              console.error('Error submitting website:', error)
              setErrors({ submit: 'Failed to save website. Please try again.' })
            }
    }
  }

  const handleBackToStep1 = () => {
    setCurrentStep(1)
    setVerificationResult(null)
    setErrors({})
  }

  const handleBackToStep2 = () => {
    setCurrentStep(2)
    setErrors({})
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {website ? 'Edit Website' : 'Add New Website'}
            </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Step {currentStep} of 3
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <div className={`flex-1 h-1 mx-2 ${
                currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {currentStep > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <div className={`flex-1 h-1 mx-2 ${
                currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {currentStep > 3 ? <CheckCircle className="w-5 h-5" /> : '3'}
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Enter URL</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Verify Ownership</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Set Details</span>
            </div>
          </div>

          {/* Step 1: URL Entry and Verification */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Enter Your Website URL
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  We'll verify that your website exists and is accessible.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website URL *
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.url ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } dark:bg-gray-700 dark:text-white`}
                  placeholder="https://example.com"
                  disabled={isVerifying}
                />
                {errors.url && (
                  <div className="mt-2 flex items-center text-red-600">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm">{errors.url}</span>
                  </div>
                )}
              </div>

              {isVerifying && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {isCheckingUrl ? 'Checking if website is already registered...' : 'Verifying your website with Google...'}
                    </p>
                  </div>
                </div>
              )}

              {urlCheckResult && urlCheckResult.isRegistered && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                        Website Already Registered
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {urlCheckResult.message}
                      </p>
                      {urlCheckResult.isOwnWebsite && urlCheckResult.existingWebsite && (
                        <div className="mt-2">
                          <Button
                            onClick={() => {
                              // Navigate to edit the existing website
                              window.location.href = `/publisher/websites/${urlCheckResult.existingWebsite!.id}`
                            }}
                            className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                          >
                            Edit Existing Website
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {verificationResult && !verificationResult.isValid && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                        Verification Failed
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {verificationResult.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleStep1Next}
                  disabled={isVerifying || !url.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Ownership Verification */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Verify Website Ownership
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  To ensure you own this website, please choose a verification method or select your role.
                </p>
              </div>

              {/* User Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Your Role
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setUserRole('owner')}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      userRole === 'owner'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Website Owner</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">I own this website</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setUserRole('contributor')}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      userRole === 'contributor'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Contributor</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">I contribute to this website</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Ownership Verification Methods (only for owners) */}
              {userRole === 'owner' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Verification Method
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setOwnershipMethod('meta')}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        ownershipMethod === 'meta'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Meta Tag</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Add a meta tag to your website</div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setOwnershipMethod('file')}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        ownershipMethod === 'file'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Upload className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">File Upload</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Upload a verification file</div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setOwnershipMethod('dns')}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        ownershipMethod === 'dns'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">DNS Record</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Add a DNS record</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Verification Method Details */}
              {userRole === 'owner' && (
                <div className="space-y-4">
                  {ownershipMethod === 'meta' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Meta Tag Content
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-3">
                        <code className="text-sm text-gray-800 dark:text-gray-200">
                          {`<meta name="alpus-verification" content="`}
                          <span className="text-blue-600 font-bold">your-verification-code</span>
                          {`" />`}
                        </code>
                      </div>
                      <input
                        type="text"
                        value={metaTagContent}
                        onChange={(e) => setMetaTagContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter your verification code"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Add this meta tag to your website's &lt;head&gt; section, then enter the verification code above.
                      </p>
                    </div>
                  )}

                  {ownershipMethod === 'file' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Upload Verification File
                      </label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <input
                          type="file"
                          onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="verification-file"
                          accept=".txt,.html"
                        />
                        <label
                          htmlFor="verification-file"
                          className="cursor-pointer text-blue-600 hover:text-blue-800"
                        >
                          Choose file or drag and drop
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Upload a .txt or .html file with the verification code
                        </p>
                      </div>
                      {uploadedFile && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ {uploadedFile.name} selected
                        </p>
                      )}
                    </div>
                  )}

                  {ownershipMethod === 'dns' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        DNS Record
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-3">
                        <code className="text-sm text-gray-800 dark:text-gray-200">
                          TXT record: <span className="text-blue-600 font-bold">alpus-verification=your-code</span>
                        </code>
                      </div>
                      <input
                        type="text"
                        value={dnsRecord}
                        onChange={(e) => setDnsRecord(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter your verification code"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Add a TXT record to your domain's DNS settings with the verification code.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Contributor Notice */}
              {userRole === 'contributor' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                        Contributor Access
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        As a contributor, you can skip ownership verification and proceed to set up the website details.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {errors.ownership && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                    <span className="text-sm text-red-700 dark:text-red-300">{errors.ownership}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleOwnershipVerification}
                  disabled={isVerifyingOwnership || (userRole === 'owner' && ownershipMethod === 'meta' && !metaTagContent.trim())}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
                >
                  {isVerifyingOwnership ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      {userRole === 'contributor' ? 'Skip & Continue' : 'Verify Ownership'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Website Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                  {website ? 'Update Website Details' : 'Website Details'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {website ? 'Update your pricing and categories for this website.' : 'Set your pricing and select relevant categories for your website.'}
                </p>
              </div>

              {/* Verified URL Display */}
              {verificationResult && verificationResult.isValid && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                        Website Verified Successfully
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        {url} has been verified and is ready to be added.
                      </p>
                    </div>
                  </div>
                </div>
              )}



              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Guest Post Price ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.guestPostPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, guestPostPrice: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.guestPostPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } dark:bg-gray-700 dark:text-white`}
                    placeholder="e.g., 150"
                  />
                  {errors.guestPostPrice && <p className="text-red-500 text-sm mt-1">{errors.guestPostPrice}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Link Insertion Price ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.linkInsertionPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkInsertionPrice: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.linkInsertionPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } dark:bg-gray-700 dark:text-white`}
                    placeholder="e.g., 50"
                  />
                  {errors.linkInsertionPrice && <p className="text-red-500 text-sm mt-1">{errors.linkInsertionPrice}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Writing + Guest Post Price ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.writingGuestPostPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, writingGuestPostPrice: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.writingGuestPostPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } dark:bg-gray-700 dark:text-white`}
                    placeholder="e.g., 220"
                  />
                  {errors.writingGuestPostPrice && <p className="text-red-500 text-sm mt-1">{errors.writingGuestPostPrice}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Turnaround Time (days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.tatDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, tatDays: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.tatDays ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } dark:bg-gray-700 dark:text-white`}
                    placeholder="e.g., 7"
                  />
                  {errors.tatDays && <p className="text-red-500 text-sm mt-1">{errors.tatDays}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.country ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } dark:bg-gray-700 dark:text-white`}
                    placeholder="e.g., United States"
                  />
                  {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language *
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ru">Russian</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                    <option value="ar">Arabic</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Blog Categories *
                </label>
                <MultiSelect
                  options={blogCategories}
                  value={formData.categories}
                  onChange={(value) => setFormData(prev => ({ ...prev, categories: value }))}
                  placeholder="Select relevant categories for your blog"
                  className={errors.categories ? 'border-red-500' : ''}
                />
                {errors.categories && <p className="text-red-500 text-sm mt-1">{errors.categories}</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select all categories that apply to your blog content
                </p>
              </div>

              <div className="flex justify-between">
                <Button
                  onClick={handleBackToStep2}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleStep2Save}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                >
                  {website ? 'Update Website' : 'Save Website'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
