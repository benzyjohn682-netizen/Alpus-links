"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { apiService } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Globe, Calendar, DollarSign, Settings } from 'lucide-react'
import Link from 'next/link'

interface Website {
  _id: string
  name: string
  url: string
  domain?: string
  description?: string
  category: string
  categories?: string[]
  status: 'active' | 'inactive' | 'pending' | 'rejected'
  pricing?: {
    guestPost?: number
    linkInsertion?: number
  }
  createdAt: string
  updatedAt: string
}

export default function WebsiteDomainPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [website, setWebsite] = useState<Website | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const websiteId = params.id as string

  useEffect(() => {
    const loadWebsite = async () => {
      if (!user?.id || !websiteId) return

      try {
        setLoading(true)
        const response = await apiService.getWebsite(websiteId)
        if (response.data) {
          setWebsite(response.data as Website)
        } else {
          setError('Website not found')
        }
      } catch (err) {
        setError('Failed to load website')
        console.error('Error loading website:', err)
      } finally {
        setLoading(false)
      }
    }

    loadWebsite()
  }, [user?.id, websiteId])

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["publisher"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading website...</p>
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
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Website Not Found
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error || 'The website you are looking for does not exist.'}
              </p>
              <Link
                href="/publisher/websites"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {website.domain || new URL(website.url).hostname.replace('www.', '')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {website.url}
                </p>
              </div>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                website.status === 'active' ? 'bg-green-100 text-green-800' :
                website.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                website.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {website.status}
              </span>
            </div>
          </div>

          {/* Website Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Website Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Domain</label>
                  <p className="text-gray-900 dark:text-white">{website.domain || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                  <p className="text-gray-900 dark:text-white">{website.category}</p>
                </div>
                {website.categories && website.categories.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Categories</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {website.categories.map((category, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Pricing
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Guest Post Price</label>
                  <p className="text-gray-900 dark:text-white">
                    {website.pricing?.guestPost ? `$${website.pricing.guestPost}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Link Insertion Price</label>
                  <p className="text-gray-900 dark:text-white">
                    {website.pricing?.linkInsertion ? `$${website.pricing.linkInsertion}` : 'Not set'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Timeline
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(website.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(website.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Actions
              </h2>
              <div className="space-y-3">
                <Link
                  href={`/publisher/websites/edit/${website._id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Website
                </Link>
                <Link
                  href="/publisher/websites"
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Websites
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
