"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { apiService } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, ArrowRight, Shield, Upload, Globe, FileText, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import CustomSelect from '@/components/ui/custom-select'
import { verifyUrl } from '@/lib/urlVerification'
import { validateDomain, isLikelyFakeDomain } from '@/lib/domainValidation'
import { normalizeUrl } from '@/lib/utils'
import toast from 'react-hot-toast'

// Categories and other data
const categories = [
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

interface UrlCheckResult {
  isRegistered: boolean
  message: string
}

export default function CreateWebsitePage() {
  const { user } = useAuth()
  const router = useRouter()
  
  // Form state
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
    language: 'en',
    minWordCount: '',
    maxLinks: ''
  })

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
      // Extract domain for validation
      const domain = normalizedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
      
      // Check if domain looks suspicious
      if (isLikelyFakeDomain(domain)) {
        setErrors({ 
          url: 'This domain appears to be fake or suspicious. Please enter a legitimate website URL.' 
        })
        return
      }

      // First check if URL is already registered
      const urlCheck = await apiService.checkWebsiteUrl(normalizedUrl)
      
      if (urlCheck.data && typeof urlCheck.data === 'object' && 'isRegistered' in urlCheck.data && urlCheck.data.isRegistered) {
        setUrlCheckResult(urlCheck.data as UrlCheckResult)
        setErrors({ url: (urlCheck.data as UrlCheckResult).message })
        return
      }

      // Perform comprehensive domain validation
      const domainValidation = await validateDomain(normalizedUrl)
      setVerificationResult(domainValidation)

      if (domainValidation.isValid) {
        setCurrentStep(2) // Move to ownership verification step
        toast.success(`Domain verified: ${domainValidation.title}`)
      } else {
        let errorMessage = 'Domain validation failed'
        
        if (!domainValidation.isAccessible) {
          errorMessage = 'This domain is not accessible. Please check the URL and try again.'
        } else if (!domainValidation.isSearchable) {
          errorMessage = 'This domain does not appear in Google search results. Please enter a legitimate website URL.'
        } else {
          errorMessage = domainValidation.error || 'Domain validation failed'
        }
        
        setErrors({ url: errorMessage })
      }
    } catch (error) {
      setErrors({ url: 'Failed to verify domain. Please try again.' })
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

    if (ownershipMethod === 'skip') {
      setCurrentStep(3) // Skip to final step
      return
    }

    setIsVerifyingOwnership(true)
    setErrors({})

    try {
      const verificationData = {
        url,
        method: ownershipMethod,
        userRole,
        ...(ownershipMethod === 'meta' && { metaTagContent }),
        ...(ownershipMethod === 'file' && { fileName: uploadedFile?.name }),
        ...(ownershipMethod === 'dns' && { dnsRecord })
      }

      const result = await apiService.verifyWebsiteOwnership(verificationData)
      setOwnershipVerificationResult(result.data)

      if (result.data && typeof result.data === 'object' && 'isVerified' in result.data && result.data.isVerified) {
        setCurrentStep(3) // Move to final step
      } else {
        const errorMessage = result.data && typeof result.data === 'object' && 'message' in result.data 
          ? String(result.data.message) 
          : 'Ownership verification failed'
        setErrors({ ownership: errorMessage })
      }
    } catch (error) {
      setErrors({ ownership: 'Failed to verify ownership. Please try again.' })
    } finally {
      setIsVerifyingOwnership(false)
    }
  }

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
      const websiteData = {
        url,
        categories: formData.categories,
        pricing: {
          ...(formData.guestPostPrice && { guestPost: parseFloat(formData.guestPostPrice) }),
          ...(formData.linkInsertionPrice && { linkInsertion: parseFloat(formData.linkInsertionPrice) }),
          ...(formData.writingGuestPostPrice && { writingGuestPost: parseFloat(formData.writingGuestPostPrice) })
        },
        turnaroundTimeDays: parseInt(formData.tatDays) || 7,
        country: formData.country,
        language: formData.language,
        meta: {
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

      const response = await apiService.createWebsite(websiteData)
      if (response.data) {
        toast.success('Website created successfully!')
        
        // Dispatch event to update sidebar
        window.dispatchEvent(new CustomEvent('websiteCreated'))
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/publisher/websites')
        }, 2000)
      }
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to create website' })
    }
  }

  return (
    <ProtectedRoute allowedRoles={["publisher"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Link
                href="/publisher/websites"
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to My Websites
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create New Website
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Add a new website to your portfolio for guest posting and link insertion services
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
                </div>
                <span className="font-medium">Enter URL</span>
              </div>
              <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {currentStep > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
                </div>
                <span className="font-medium">Verify Ownership</span>
              </div>
              <div className={`w-16 h-0.5 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  3
                </div>
                <span className="font-medium">Set Details</span>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-8">
              {/* Step 1: Enter URL */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Enter Your Website URL
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      We'll verify that your website exists, is accessible, and appears in Google search results.
                    </p>
                    <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            Domain Validation
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                            We check if your domain is legitimate by verifying it exists and appears in Google searches.
                            Fake domains like "dfewrwerqedsre.com" will be rejected.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Website URL *
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none dark:bg-gray-700 dark:text-white ${
                          errors.url 
                            ? 'border-red-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        disabled={isVerifying}
                      />
                      {isVerifying && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Domain validation hints */}
                    {url && !isVerifying && !errors.url && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4" />
                          <span>We'll verify this domain exists and appears in Google searches</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Examples: portotheme.com ✓ | dfewrwerqedsre.com ✗
                        </div>
                      </div>
                    )}
                    
                    {errors.url && (
                      <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                              Domain Validation Failed
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                              {errors.url}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Success message */}
                    {verificationResult && verificationResult.isValid && (
                      <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                              Domain Verified Successfully
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                              {verificationResult.title}
                            </p>
                            {verificationResult.description && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                {verificationResult.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleStep1Next}
                      disabled={isVerifying || !url.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Next <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Verify Ownership */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                      Verify Website Ownership
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                      Choose how you'd like to verify that you own this website. This helps us ensure the quality of our platform.
                    </p>
                  </div>

                  <div className="max-w-4xl mx-auto">
                    {/* Your Role Section */}
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
                        Your Role
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="relative cursor-pointer group transition-all duration-200">
                          <input
                            type="radio"
                            name="userRole"
                            value="owner"
                            checked={userRole === 'owner'}
                            onChange={(e) => setUserRole(e.target.value as 'owner' | 'contributor')}
                            className="sr-only"
                          />
                          <div className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                            userRole === 'owner'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}>
                            <div className="flex items-center space-x-4">
                              <div className={`p-3 rounded-lg ${
                                userRole === 'owner'
                                  ? 'bg-blue-100 dark:bg-blue-800/30'
                                  : 'bg-gray-100 dark:bg-gray-700'
                              }`}>
                                <User className={`w-6 h-6 ${
                                  userRole === 'owner'
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  I own this website
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  You have full control over this domain
                                </p>
                              </div>
                            </div>
                          </div>
                        </label>

                        <label className="relative cursor-pointer group transition-all duration-200">
                          <input
                            type="radio"
                            name="userRole"
                            value="contributor"
                            checked={userRole === 'contributor'}
                            onChange={(e) => setUserRole(e.target.value as 'owner' | 'contributor')}
                            className="sr-only"
                          />
                          <div className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                            userRole === 'contributor'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}>
                            <div className="flex items-center space-x-4">
                              <div className={`p-3 rounded-lg ${
                                userRole === 'contributor'
                                  ? 'bg-blue-100 dark:bg-blue-800/30'
                                  : 'bg-gray-100 dark:bg-gray-700'
                              }`}>
                                <FileText className={`w-6 h-6 ${
                                  userRole === 'contributor'
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  I contribute to this website
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  You write or manage content for this site
                                </p>
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Verification Methods */}
                    {userRole === 'owner' && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                          Choose Verification Method
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Meta Tag Verification */}
                          <label className="relative cursor-pointer group transition-all duration-200">
                            <input
                              type="radio"
                              name="ownershipMethod"
                              value="meta"
                              checked={ownershipMethod === 'meta'}
                              onChange={(e) => setOwnershipMethod(e.target.value as any)}
                              className="sr-only"
                            />
                            <div className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                              ownershipMethod === 'meta'
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}>
                              <div className="flex items-start space-x-4">
                                <div className={`p-3 rounded-lg ${
                                  ownershipMethod === 'meta'
                                    ? 'bg-green-100 dark:bg-green-800/30'
                                    : 'bg-gray-100 dark:bg-gray-700'
                                }`}>
                                  <Shield className={`w-6 h-6 ${
                                    ownershipMethod === 'meta'
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-gray-600 dark:text-gray-400'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    Meta Tag Verification
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Add a meta tag to your website's head section. This is the most common method.
                                  </p>
                                  {ownershipMethod === 'meta' && (
                                    <div className="mt-4">
                                      <input
                                        type="text"
                                        value={metaTagContent}
                                        onChange={(e) => setMetaTagContent(e.target.value)}
                                        placeholder="Enter meta tag content"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </label>

                          {/* File Upload Verification */}
                          <label className="relative cursor-pointer group transition-all duration-200">
                            <input
                              type="radio"
                              name="ownershipMethod"
                              value="file"
                              checked={ownershipMethod === 'file'}
                              onChange={(e) => setOwnershipMethod(e.target.value as any)}
                              className="sr-only"
                            />
                            <div className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                              ownershipMethod === 'file'
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}>
                              <div className="flex items-start space-x-4">
                                <div className={`p-3 rounded-lg ${
                                  ownershipMethod === 'file'
                                    ? 'bg-green-100 dark:bg-green-800/30'
                                    : 'bg-gray-100 dark:bg-gray-700'
                                }`}>
                                  <Upload className={`w-6 h-6 ${
                                    ownershipMethod === 'file'
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-gray-600 dark:text-gray-400'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    File Upload Verification
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Upload a verification file to your website's root directory.
                                  </p>
                                  {ownershipMethod === 'file' && (
                                    <div className="mt-4">
                                      <input
                                        type="file"
                                        onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:outline-none"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </label>

                          {/* DNS Record Verification */}
                          <label className="relative cursor-pointer group transition-all duration-200">
                            <input
                              type="radio"
                              name="ownershipMethod"
                              value="dns"
                              checked={ownershipMethod === 'dns'}
                              onChange={(e) => setOwnershipMethod(e.target.value as any)}
                              className="sr-only"
                            />
                            <div className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                              ownershipMethod === 'dns'
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}>
                              <div className="flex items-start space-x-4">
                                <div className={`p-3 rounded-lg ${
                                  ownershipMethod === 'dns'
                                    ? 'bg-green-100 dark:bg-green-800/30'
                                    : 'bg-gray-100 dark:bg-gray-700'
                                }`}>
                                  <Globe className={`w-6 h-6 ${
                                    ownershipMethod === 'dns'
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-gray-600 dark:text-gray-400'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    DNS Record Verification
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Add a DNS TXT record to your domain's DNS settings.
                                  </p>
                                  {ownershipMethod === 'dns' && (
                                    <div className="mt-4">
                                      <input
                                        type="text"
                                        value={dnsRecord}
                                        onChange={(e) => setDnsRecord(e.target.value)}
                                        placeholder="Enter DNS record"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </label>

                          {/* Skip Verification */}
                          <label className="relative cursor-pointer group transition-all duration-200">
                            <input
                              type="radio"
                              name="ownershipMethod"
                              value="skip"
                              checked={ownershipMethod === 'skip'}
                              onChange={(e) => setOwnershipMethod(e.target.value as any)}
                              className="sr-only"
                            />
                            <div className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                              ownershipMethod === 'skip'
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}>
                              <div className="flex items-start space-x-4">
                                <div className={`p-3 rounded-lg ${
                                  ownershipMethod === 'skip'
                                    ? 'bg-orange-100 dark:bg-orange-800/30'
                                    : 'bg-gray-100 dark:bg-gray-700'
                                }`}>
                                  <ArrowRight className={`w-6 h-6 ${
                                    ownershipMethod === 'skip'
                                      ? 'text-orange-600 dark:text-orange-400'
                                      : 'text-gray-600 dark:text-gray-400'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    Skip for now
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    You can verify ownership later from your website settings.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>
            </div>
          )}

                    {errors.ownership && (
                      <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                          <p className="text-sm text-red-600 dark:text-red-400">{errors.ownership}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between max-w-4xl mx-auto">
                    <Button
                      onClick={() => setCurrentStep(1)}
                      variant="outline"
                      className="px-8 py-3 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleOwnershipVerification}
                      disabled={isVerifyingOwnership}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                      {isVerifyingOwnership ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Next <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
            </div>
          )}

              {/* Step 3: Set Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Set Website Details
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Configure your website's categories, pricing, and requirements.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Categories *
                      </label>
                      <MultiSelect
                        options={categories}
                        value={formData.categories}
                        onChange={(value) => setFormData(prev => ({ ...prev, categories: value }))}
                        placeholder="Select categories"
                      />
                      {errors.categories && (
                        <p className="mt-2 text-sm text-red-600">{errors.categories}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Country *
                      </label>
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Language
                      </label>
                      <CustomSelect
                        options={languages}
                        value={formData.language}
                        onChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                        placeholder="Select language"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Turnaround Time (Days)
                      </label>
                      <input
                        type="number"
                        value={formData.tatDays}
                        onChange={(e) => setFormData(prev => ({ ...prev, tatDays: e.target.value }))}
                        placeholder="7"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Guest Post Price ($)
                      </label>
                      <input
                        type="number"
                        value={formData.guestPostPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, guestPostPrice: e.target.value }))}
                        placeholder="0"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Link Insertion Price ($)
                      </label>
                      <input
                        type="number"
                        value={formData.linkInsertionPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, linkInsertionPrice: e.target.value }))}
                        placeholder="0"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Writing + Guest Post Price ($)
                      </label>
                      <input
                        type="number"
                        value={formData.writingGuestPostPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, writingGuestPostPrice: e.target.value }))}
                        placeholder="0"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Minimum Word Count
                      </label>
                      <input
                        type="number"
                        value={formData.minWordCount}
                        onChange={(e) => setFormData(prev => ({ ...prev, minWordCount: e.target.value }))}
                        placeholder="500"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Maximum Links
                      </label>
                      <input
                        type="number"
                        value={formData.maxLinks}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxLinks: e.target.value }))}
                        placeholder="3"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {errors.submit}
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button
                      onClick={() => setCurrentStep(2)}
                      variant="outline"
                      className="px-6 py-3"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create Website
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
