"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { TwoStepWebsiteForm } from '@/components/website/TwoStepWebsiteForm'
import { useAuth } from '@/contexts/auth-context'
import { apiService } from '@/lib/api'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function CreateWebsitePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleCreateWebsite = async (websiteData: any) => {
    try {
      const response = await apiService.createWebsite(websiteData)
      if (response.data) {
        toast.success('Website created successfully!')
        setError(null)
        
        // Dispatch event to update sidebar
        window.dispatchEvent(new CustomEvent('websiteCreated'))
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/publisher/websites')
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create website')
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

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Website Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <TwoStepWebsiteForm
              onSubmit={handleCreateWebsite}
              onClose={() => router.push('/publisher/websites')}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
