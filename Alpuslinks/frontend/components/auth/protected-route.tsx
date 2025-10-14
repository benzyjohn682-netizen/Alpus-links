"use client"

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { getRoleNameLowercase } from '@/lib/roleUtils'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Array<'super admin' | 'admin' | 'publisher' | 'advertiser' | 'supportor'>
}

function getHomePathForRole(role?: any) {
  const roleName = getRoleNameLowercase(role)
  switch (roleName) {
    case 'super admin':
    case 'admin':
      return '/alpus-admin/dashboard'
    case 'publisher':
      return '/publisher/dashboard'
    case 'advertiser':
      return '/advertiser/dashboard'
    case 'supportor':
      return '/supportor/account'
    default:
      return '/'
  }
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  const userRole = useMemo(() => {
    return getRoleNameLowercase(user?.role)
  }, [user])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (!isLoading && isAuthenticated && allowedRoles && allowedRoles.length > 0) {
      const allowed = allowedRoles.map(r => r.toLowerCase())
      if (!allowed.includes(userRole)) {
        router.replace(getHomePathForRole(user?.role))
      }
    }
  }, [allowedRoles, isAuthenticated, isLoading, router, user?.role, userRole])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute