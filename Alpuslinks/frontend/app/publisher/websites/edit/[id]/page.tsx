"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { TwoStepWebsiteForm } from '@/components/website/TwoStepWebsiteForm'
import { useAuth } from '@/contexts/auth-context'
import { apiService } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
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

export default function EditWebsitePage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const websiteId = params.id as string
  
  const [website, setWebsite] = useState<Website | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadWebsite = async () => {
      if (!websiteId || !user?.id) return

      try {
        setLoading(true)
        setError(null)
        
        const response = await apiService.getWebsite(websiteId)
        if (response.data) {
          setWebsite(response.data as Website)
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

    loadWebsite()
  }, [websiteId, user?.id])

  const handleUpdateWebsite = async (websiteData: any) => {
    try {
      const response = await apiService.updateWebsite(websiteId, websiteData)
      if (response.data) {
        toast.success('Website updated successfully!')
        setError(null)
        
        // Dispatch event to update sidebar
        window.dispatchEvent(new CustomEvent('websiteUpdated'))
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/publisher/websites')
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update website')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["publisher"]}>
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
      <ProtectedRoute allowedRoles={["publisher"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-4xl mx-auto">
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
                href="/publisher/websites"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to My Websites
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
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
              Edit Website
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Update your website information for guest posting and link insertion services
            </p>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Website Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <TwoStepWebsiteForm
              website={website}
              onSubmit={handleUpdateWebsite}
              onClose={() => router.push('/publisher/websites')}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
