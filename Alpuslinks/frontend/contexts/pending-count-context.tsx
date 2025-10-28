"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getRoleNameLowercase } from '@/lib/roleUtils'
import { apiService } from '@/lib/api'

interface PendingCountContextType {
  pendingWebsitesCount: number
  refreshPendingCount: () => Promise<void>
  clearPendingCount: () => void
}

const PendingCountContext = createContext<PendingCountContextType | undefined>(undefined)

export function PendingCountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [pendingWebsitesCount, setPendingWebsitesCount] = useState(0)
  const role = getRoleNameLowercase(user?.role)

  const refreshPendingCount = async () => {
    if (role === 'admin' || role === 'super admin') {
      try {
        const response = await apiService.getPendingWebsitesCount()
        setPendingWebsitesCount(response.data?.pendingCount || 0)
      } catch (error) {
        console.error('Failed to fetch pending websites count:', error)
      }
    }
  }

  const clearPendingCount = () => {
    setPendingWebsitesCount(0)
  }

  useEffect(() => {
    refreshPendingCount()
    
    // Set up polling to refresh the count every 10 seconds (more frequent)
    const interval = setInterval(refreshPendingCount, 10000)
    
    return () => clearInterval(interval)
  }, [role])

  // Listen for custom events to refresh the count
  useEffect(() => {
    const handleWebsiteCreated = () => {
      refreshPendingCount()
    }

    const handleWebsiteStatusChanged = () => {
      refreshPendingCount()
    }

    // Listen for custom events
    window.addEventListener('websiteCreated', handleWebsiteCreated)
    window.addEventListener('websiteStatusChanged', handleWebsiteStatusChanged)

    return () => {
      window.removeEventListener('websiteCreated', handleWebsiteCreated)
      window.removeEventListener('websiteStatusChanged', handleWebsiteStatusChanged)
    }
  }, [])

  return (
    <PendingCountContext.Provider value={{
      pendingWebsitesCount,
      refreshPendingCount,
      clearPendingCount
    }}>
      {children}
    </PendingCountContext.Provider>
  )
}

export function usePendingCount() {
  const context = useContext(PendingCountContext)
  if (context === undefined) {
    throw new Error('usePendingCount must be used within a PendingCountProvider')
  }
  return context
}
