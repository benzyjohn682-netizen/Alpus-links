"use client"
import { ProtectedRoute } from '@/components/auth/protected-route'
import { WebsiteManagement } from '@/components/website/WebsiteManagement'

export default function PublisherWebsitesPage() {
  return (
    <ProtectedRoute allowedRoles={["publisher"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <WebsiteManagement />
      </div>
    </ProtectedRoute>
  )
}
