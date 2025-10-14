"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { SystemSettings } from '@/components/admin/SystemSettings'

export default function AdminSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={["super admin", "admin"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SystemSettings />
        </div>
      </div>
    </ProtectedRoute>
  )
}
