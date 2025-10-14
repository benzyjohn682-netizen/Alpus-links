"use client"
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function SupportorPage() {
  return (
    <ProtectedRoute allowedRoles={["supportor"]}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Supportor Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This page is under construction.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  )
}


