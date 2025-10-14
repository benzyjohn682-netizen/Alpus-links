'use client'

import { useAuth } from '@/contexts/auth-context'
import { useAppSelector } from '@/hooks/redux'
import { getRoleName } from '@/lib/roleUtils'

export function AuthTest() {
  const { user, isAuthenticated, logout } = useAuth()
  const authState = useAppSelector((state) => state.auth)

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4">Authentication State Test</h3>
      
      <div className="space-y-2">
        <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user ? `${user.firstName} ${user.lastName}` : 'None'}</p>
        <p><strong>Email:</strong> {user?.email || 'None'}</p>
        <p><strong>Role:</strong> {getRoleName(user?.role) || 'None'}</p>
        <p><strong>Redux Loading:</strong> {authState.isLoading ? 'Yes' : 'No'}</p>
        <p><strong>Redux Error:</strong> {authState.error || 'None'}</p>
      </div>

      {isAuthenticated && (
        <button
          onClick={logout}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      )}
    </div>
  )
}
