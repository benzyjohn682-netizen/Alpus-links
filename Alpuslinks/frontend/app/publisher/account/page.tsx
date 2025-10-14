"use client"
import { ProtectedRoute } from '@/components/auth/protected-route'
import AccountForm from '@/components/dashboard/AccountForm'

export default function PublisherAccountPage() {
  return (
    <ProtectedRoute allowedRoles={["publisher"]}>
      <div className="min-h-screen flex items-start justify-center bg-gray-50 dark:bg-gray-900 py-10">
        <AccountForm />
      </div>
    </ProtectedRoute>
  )
}


