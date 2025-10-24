"use client"
import { ProtectedRoute } from '@/components/auth/protected-route'
import AccountForm from '@/components/dashboard/AccountForm'

export default function PublisherAccountPage() {
  return (
    <ProtectedRoute allowedRoles={["publisher"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <AccountForm />
        </div>
      </div>
    </ProtectedRoute>
  )
}


