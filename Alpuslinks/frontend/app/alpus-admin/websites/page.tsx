"use client"
import { useState, useEffect, useCallback, useMemo } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { apiService } from '@/lib/api'
import { WebsiteTable } from '@/components/website/WebsiteTable'
import { WebsiteStats } from '@/components/website/WebsiteStats'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import CustomSelect from '@/components/ui/custom-select'
import toast from 'react-hot-toast'

interface Website {
  _id: string
  url: string
  category: string
  categories?: string[]
  domainAuthority?: number
  monthlyTraffic?: number
  mozDA?: number
  ahrefsDR?: number
  semrushTraffic?: number
  language: string
  country: string
  status: 'active' | 'inactive' | 'pending' | 'rejected'
  pricing?: {
    guestPost?: number
    linkInsertion?: number
    writingGuestPost?: number
  }
  turnaroundTimeDays?: number
  publisherId?: {
    _id: string
    firstName: string
    lastName: string
    email: string
  } | null
  createdAt: string
  updatedAt: string
}

interface AdminWebsiteStats {
  overview: {
    total: number
    active: number
    pending: number
    inactive: number
    rejected: number
    avgDomainAuthority: number
    avgMonthlyTraffic: number
  }
  categories: Array<{
    _id: string
    count: number
  }>
  publishers: Array<{
    _id: string
    publisherName: string
    publisherEmail: string
    count: number
  }>
}

export default function AdminWebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [stats, setStats] = useState<AdminWebsiteStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [categories, setCategories] = useState<Array<{_id: string, name: string, slug: string}>>([])
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
    publisherId: ''
  })
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([])
  const [isSelectAll, setIsSelectAll] = useState(false)
  const [deletingWebsite, setDeletingWebsite] = useState<Website | null>(null)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const loadWebsites = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.getAllWebsites(
        currentPage,
        pageSize,
        filters.status,
        filters.category,
        filters.search,
        filters.publisherId
      )

      if (response.data) {
        const data = response.data as any
        setWebsites(data.websites || [])
        setTotalPages(data.totalPages || 1)
        setTotalItems(data.total || 0)
      } else {
        setWebsites([])
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load websites'
      setError(errorMessage)
      setWebsites([])
      // Auto-hide error after 5 seconds
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, filters.status, filters.category, filters.search, filters.publisherId])

  const loadStats = useCallback(async () => {
    try {
      const response = await apiService.getAllWebsiteStats()
      if (response.data) {
        setStats(response.data as AdminWebsiteStats)
      }
    } catch (err) {
      // Stats loading failure shouldn't block the main functionality
      // Just log it silently or show a subtle warning
      console.warn('Failed to load website statistics:', err)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const response = await apiService.getCategories()
      if (response.data && (response.data as any).success) {
        setCategories((response.data as any).data || [])
      }
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }, [])

  useEffect(() => {
    loadWebsites()
  }, [loadWebsites])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Update select all state when individual selections change
  useEffect(() => {
    if (websites.length > 0) {
      const allSelected = websites.every(website => selectedWebsites.includes(website._id))
      setIsSelectAll(allSelected)
    } else {
      setIsSelectAll(false)
    }
  }, [selectedWebsites, websites])

  const handleUpdateWebsiteStatus = async (websiteId: string, status: string) => {
    try {
      setError(null)
      const response = await apiService.updateWebsiteStatus(websiteId, status)
      if (response.data) {
        setWebsites(prev => 
          prev.map(website => 
            website._id === websiteId ? { ...website, status: status as any } : website
          )
        )
        toast.success(`Website status updated to ${status}`)
        loadStats() // Refresh stats
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update website status'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleDeleteWebsite = (website: Website) => {
    setDeletingWebsite(website)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingWebsite) return

    try {
      setError(null)
      await apiService.deleteWebsite(deletingWebsite._id)
      setWebsites(prev => prev.filter(website => website._id !== deletingWebsite._id))
      toast.success('Website deleted successfully!')
      setDeletingWebsite(null)
      loadStats() // Refresh stats
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete website'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleDeleteCancel = () => {
    setDeletingWebsite(null)
  }

  const handleEditWebsite = (website: Website) => {
    setEditingWebsite(website)
    setShowEditModal(true)
  }

  const handleEditConfirm = async (updatedData: Partial<Website>) => {
    if (!editingWebsite) return

    try {
      setLoading(true)
      setError(null)
      const response = await apiService.updateWebsite(editingWebsite._id, updatedData)
      
      if (response.data) {
        setWebsites(prev => 
          prev.map(website => 
            website._id === editingWebsite._id ? { ...website, ...updatedData } : website
          )
        )
        toast.success('Website updated successfully!')
        setEditingWebsite(null)
        setShowEditModal(false)
        loadStats() // Refresh stats
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update website'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCancel = () => {
    setEditingWebsite(null)
    setShowEditModal(false)
  }

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when page size changes
  }

  // Bulk selection handlers
  const handleSelectWebsite = useCallback((websiteId: string) => {
    setSelectedWebsites(prev => {
      const newSelection = prev.includes(websiteId) 
        ? prev.filter(id => id !== websiteId)
        : [...prev, websiteId]
      return newSelection
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (isSelectAll || selectedWebsites.length === websites.length) {
      setSelectedWebsites([])
      setIsSelectAll(false)
    } else {
      const allWebsiteIds = websites.map(website => website._id)
      setSelectedWebsites(allWebsiteIds)
      setIsSelectAll(true)
    }
  }, [isSelectAll, selectedWebsites.length, websites])

  const handleBulkDelete = () => {
    if (selectedWebsites.length === 0) return
    setShowBulkDeleteModal(true)
  }

  const handleBulkDeleteConfirm = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.bulkDeleteWebsites(selectedWebsites)
      
      if (response.data) {
        setWebsites(prev => prev.filter(website => !selectedWebsites.includes(website._id)))
        setSelectedWebsites([])
        setIsSelectAll(false)
        setShowBulkDeleteModal(false)
        toast.success(`Successfully deleted ${selectedWebsites.length} website(s)!`)
        loadStats() // Refresh stats
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete selected websites')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteModal(false)
  }

  const handleBulkStatusChange = async (status: string) => {
    if (selectedWebsites.length === 0) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.bulkUpdateWebsiteStatus(selectedWebsites, status)
      
      if (response.data) {
        setWebsites(prev => 
          prev.map(website => 
            selectedWebsites.includes(website._id) 
              ? { ...website, status: status as any }
              : website
          )
        )
        setSelectedWebsites([])
        setIsSelectAll(false)
        toast.success(`Successfully updated ${selectedWebsites.length} website(s) status to ${status}!`)
        loadStats() // Refresh stats
      } else {
        setError('No data received from server')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update selected websites status')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  if (loading && websites.length === 0) {
    return (
      <ProtectedRoute allowedRoles={["super admin", "admin"]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading websites...</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">Please wait while we fetch the latest data</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["super admin", "admin"]}>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            All Publisher Websites
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and monitor all websites registered by publishers
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}


        {/* Stats Overview */}
        {stats && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Websites</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.overview.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.overview.active}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.overview.pending}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.overview.rejected}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Action Bar */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search Section */}
              <div className="flex-1">

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by domain or URL..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange({ search: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Filters Section */}
              <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
                {/* Status Filter */}
                <div className="min-w-[160px]">
                  <CustomSelect
                    options={[
                      { value: '', label: 'All Status' },
                      { value: 'active', label: '✅ Active' },
                      { value: 'pending', label: '⏳ Pending' },
                      { value: 'inactive', label: '⏸️ Inactive' },
                      { value: 'rejected', label: '❌ Rejected' }
                    ]}
                    value={filters.status}
                    onChange={(value) => handleFilterChange({ status: value })}
                    placeholder="All Status"
                  />
                </div>

                {/* Category Filter */}
                <div className="min-w-[180px]">
                  <CustomSelect
                    options={[
                      { value: '', label: 'All Categories' },
                      ...categories.map(category => ({
                        value: category.name,
                        label: `${category.name.charAt(0).toUpperCase() + category.name.slice(1)}`
                      }))
                    ]}
                    value={filters.category}
                    onChange={(value) => handleFilterChange({ category: value })}
                    placeholder="All Categories"
                  />
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            {(() => {
              const hasActiveFilters = filters.search || filters.status || filters.category
              return hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                    {filters.search && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Search: "{filters.search}"
                        <button
                          onClick={() => handleFilterChange({ search: '' })}
                          className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {filters.status && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Status: {filters.status}
                        <button
                          onClick={() => handleFilterChange({ status: '' })}
                          className="ml-2 text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {filters.category && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Category: {filters.category}
                        <button
                          onClick={() => handleFilterChange({ category: '' })}
                          className="ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    <button
                      onClick={() => handleFilterChange({ search: '', status: '', category: '' })}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Enhanced Bulk Actions */}
        {selectedWebsites.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm animate-in slide-in-from-top-2 duration-300">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full animate-pulse">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      {selectedWebsites.length} Website{selectedWebsites.length !== 1 ? 's' : ''} Selected
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Choose an action to apply to all selected websites
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Selected IDs: {selectedWebsites.slice(0, 3).join(', ')}{selectedWebsites.length > 3 ? '...' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleBulkStatusChange('active')}
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all duration-200 hover:shadow-md"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {loading ? 'Processing...' : 'Approve Selected'}
                  </Button>
                  <Button
                    onClick={() => handleBulkStatusChange('rejected')}
                    variant="default"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all duration-200 hover:shadow-md"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {loading ? 'Processing...' : 'Reject Selected'}
                  </Button>
                  <Button
                    onClick={() => handleBulkStatusChange('inactive')}
                    variant="default"
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm transition-all duration-200 hover:shadow-md"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {loading ? 'Processing...' : 'Deactivate Selected'}
                  </Button>
                  <Button
                    onClick={handleBulkDelete}
                    variant="destructive"
                    size="sm"
                    className="shadow-sm transition-all duration-200 hover:shadow-md"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {loading ? 'Processing...' : 'Delete Selected'}
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedWebsites([])
                      setIsSelectAll(false)
                    }}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Website Table */}
        <AdminWebsiteTable
          websites={websites}
          loading={loading}
          onEdit={handleEditWebsite}
          onDelete={handleDeleteWebsite}
          onStatusChange={handleUpdateWebsiteStatus}
          selectedWebsites={selectedWebsites}
          onSelectWebsite={handleSelectWebsite}
          onSelectAll={handleSelectAll}
          isSelectAll={isSelectAll}
        />
        
        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          totalItems={totalItems}
          showPageSizeSelector={true}
          loading={loading}
        />

        {/* Individual Delete Confirmation Modal */}
        {deletingWebsite && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Delete Website
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Are you sure you want to delete <strong>{new URL(deletingWebsite.url).hostname.replace('www.', '')}</strong>? 
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Website
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Delete Websites
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Are you sure you want to delete <strong>{selectedWebsites.length} website(s)</strong>? 
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleBulkDeleteCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete {selectedWebsites.length} Website{selectedWebsites.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Website Modal */}
        {showEditModal && editingWebsite && (
          <EditWebsiteModal
            website={editingWebsite}
            onSave={handleEditConfirm}
            onCancel={handleEditCancel}
            loading={loading}
          />
        )}

        {/* Loading Overlay for Bulk Operations */}
        {loading && selectedWebsites.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Processing {selectedWebsites.length} website{selectedWebsites.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Please wait while we update the selected websites...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

// Admin-specific website table with additional actions
interface AdminWebsiteTableProps {
  websites: Website[]
  loading: boolean
  onEdit: (website: Website) => void
  onDelete: (website: Website) => void
  onStatusChange: (websiteId: string, status: string) => void
  selectedWebsites: string[]
  onSelectWebsite: (websiteId: string) => void
  onSelectAll: () => void
  isSelectAll: boolean
}

function AdminWebsiteTable({
  websites,
  loading,
  onEdit,
  onDelete,
  onStatusChange,
  selectedWebsites,
  onSelectWebsite,
  onSelectAll,
  isSelectAll
}: AdminWebsiteTableProps) {
  const [sortField, setSortField] = useState<keyof Website>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: keyof Website) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatNumber = (num?: number) => {
    if (!num) return 'N/A'
    return num.toLocaleString()
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A'
    return `$${amount.toLocaleString()}`
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-gray-100 text-gray-800',
    rejected: 'bg-red-100 text-red-800'
  }

  const categoryColors = {
    technology: 'bg-blue-100 text-blue-800',
    business: 'bg-purple-100 text-purple-800',
    health: 'bg-green-100 text-green-800',
    finance: 'bg-yellow-100 text-yellow-800',
    education: 'bg-indigo-100 text-indigo-800',
    lifestyle: 'bg-pink-100 text-pink-800',
    travel: 'bg-cyan-100 text-cyan-800',
    food: 'bg-orange-100 text-orange-800',
    sports: 'bg-red-100 text-red-800',
    entertainment: 'bg-purple-100 text-purple-800',
    news: 'bg-gray-100 text-gray-800',
    fashion: 'bg-rose-100 text-rose-800',
    beauty: 'bg-pink-100 text-pink-800',
    parenting: 'bg-amber-100 text-amber-800',
    home: 'bg-emerald-100 text-emerald-800',
    automotive: 'bg-slate-100 text-slate-800',
    gaming: 'bg-violet-100 text-violet-800',
    photography: 'bg-sky-100 text-sky-800',
    music: 'bg-fuchsia-100 text-fuchsia-800',
    art: 'bg-amber-100 text-amber-800',
    other: 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (websites.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No websites found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            No websites match your current filters.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={isSelectAll}
                  onChange={onSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('url')}
              >
                <div className="flex items-center space-x-1">
                  <span>Website</span>
                  {sortField === 'url' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Publisher
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Metrics</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Pricing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                TAT (Days)
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {sortField === 'status' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {websites.map((website) => (
              <tr key={website._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedWebsites.includes(website._id)}
                    onChange={() => onSelectWebsite(website._id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new URL(website.url).hostname.replace('www.', '')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <a
                        href={website.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {website.url}
                      </a>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {website.publisherId ? `${website.publisherId.firstName} ${website.publisherId.lastName}` : 'Unknown Publisher'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {website.publisherId?.email || 'N/A'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-2">
                    {/* Moz DA */}
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Moz DA:</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {website.mozDA ? `${website.mozDA}/100` : 'N/A'}
                      </span>
                    </div>
                    
                    {/* Ahrefs DR */}
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Ahrefs DR:</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {website.ahrefsDR ? `${website.ahrefsDR}/100` : 'N/A'}
                      </span>
                    </div>
                    
                    {/* Semrush Traffic */}
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Semrush:</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {website.semrushTraffic ? formatNumber(website.semrushTraffic) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div className="flex flex-col space-y-1">
                    {website.pricing?.guestPost && (
                      <div>GP: {formatCurrency(website.pricing.guestPost)}</div>
                    )}
                    {website.pricing?.linkInsertion && (
                      <div>LI: {formatCurrency(website.pricing.linkInsertion)}</div>
                    )}
                    {website.pricing?.writingGuestPost && (
                      <div>Writing + GP: {formatCurrency(website.pricing.writingGuestPost)}</div>
                    )}
                    {!website.pricing?.guestPost && !website.pricing?.linkInsertion && !website.pricing?.writingGuestPost && (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {website.turnaroundTimeDays ? `${website.turnaroundTimeDays} days` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    statusColors[website.status]
                  }`}>
                    {website.status.charAt(0).toUpperCase() + website.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex flex-col space-y-3">
                    {/* Primary Actions */}
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onEdit(website)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 hover:shadow-sm"
                        title="Edit website"
                      >
                        <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(website)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 hover:shadow-sm"
                        title="Delete website"
                      >
                        <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                    
                    {/* Status Actions */}
                    <div className="flex items-center justify-end space-x-1.5">
                      {website.status !== 'active' && (
                        <button
                          onClick={() => onStatusChange(website._id, 'active')}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 rounded-md transition-all duration-200 hover:shadow-sm"
                          title="Approve website"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </button>
                      )}
                      {website.status !== 'rejected' && (
                        <button
                          onClick={() => onStatusChange(website._id, 'rejected')}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition-all duration-200 hover:shadow-sm"
                          title="Reject website"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                      )}
                      {website.status === 'active' && (
                        <button
                          onClick={() => onStatusChange(website._id, 'inactive')}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400 dark:hover:bg-gray-900/30 rounded-md transition-all duration-200 hover:shadow-sm"
                          title="Deactivate website"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Edit Website Modal Component
interface EditWebsiteModalProps {
  website: Website
  onSave: (updatedData: Partial<Website>) => void
  onCancel: () => void
  loading: boolean
}

function EditWebsiteModal({ website, onSave, onCancel, loading }: EditWebsiteModalProps) {
  const [formData, setFormData] = useState({
    url: website.url,
    category: website.category,
    categories: website.categories || [],
    domainAuthority: website.domainAuthority || 0,
    monthlyTraffic: website.monthlyTraffic || 0,
    language: website.language,
    country: website.country,
    pricing: {
      guestPost: website.pricing?.guestPost || 0,
      linkInsertion: website.pricing?.linkInsertion || 0,
      writingGuestPost: website.pricing?.writingGuestPost || 0
    },
    turnaroundTimeDays: website.turnaroundTimeDays || 7,
    status: website.status
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object || {}),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const categories = [
    'technology', 'business', 'health', 'finance', 'education', 'lifestyle',
    'travel', 'food', 'sports', 'entertainment', 'news', 'fashion', 'beauty',
    'parenting', 'home', 'automotive', 'gaming', 'photography', 'music', 'art', 'other'
  ]

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'rejected', label: 'Rejected' }
  ]

  const countries = [
    { value: 'United States', label: '🇺🇸 United States' },
    { value: 'United Kingdom', label: '🇬🇧 United Kingdom' },
    { value: 'Canada', label: '🇨🇦 Canada' },
    { value: 'Australia', label: '🇦🇺 Australia' },
    { value: 'Germany', label: '🇩🇪 Germany' },
    { value: 'France', label: '🇫🇷 France' },
    { value: 'Spain', label: '🇪🇸 Spain' },
    { value: 'Italy', label: '🇮🇹 Italy' },
    { value: 'Netherlands', label: '🇳🇱 Netherlands' },
    { value: 'Sweden', label: '🇸🇪 Sweden' },
    { value: 'Norway', label: '🇳🇴 Norway' },
    { value: 'Denmark', label: '🇩🇰 Denmark' },
    { value: 'Finland', label: '🇫🇮 Finland' },
    { value: 'Switzerland', label: '🇨🇭 Switzerland' },
    { value: 'Austria', label: '🇦🇹 Austria' },
    { value: 'Belgium', label: '🇧🇪 Belgium' },
    { value: 'Ireland', label: '🇮🇪 Ireland' },
    { value: 'New Zealand', label: '🇳🇿 New Zealand' },
    { value: 'Japan', label: '🇯🇵 Japan' },
    { value: 'South Korea', label: '🇰🇷 South Korea' },
    { value: 'Singapore', label: '🇸🇬 Singapore' },
    { value: 'Hong Kong', label: '🇭🇰 Hong Kong' },
    { value: 'India', label: '🇮🇳 India' },
    { value: 'Brazil', label: '🇧🇷 Brazil' },
    { value: 'Mexico', label: '🇲🇽 Mexico' },
    { value: 'Argentina', label: '🇦🇷 Argentina' },
    { value: 'Chile', label: '🇨🇱 Chile' },
    { value: 'South Africa', label: '🇿🇦 South Africa' },
    { value: 'Israel', label: '🇮🇱 Israel' },
    { value: 'United Arab Emirates', label: '🇦🇪 United Arab Emirates' },
    { value: 'Saudi Arabia', label: '🇸🇦 Saudi Arabia' },
    { value: 'Turkey', label: '🇹🇷 Turkey' },
    { value: 'Russia', label: '🇷🇺 Russia' },
    { value: 'China', label: '🇨🇳 China' },
    { value: 'Thailand', label: '🇹🇭 Thailand' },
    { value: 'Malaysia', label: '🇲🇾 Malaysia' },
    { value: 'Philippines', label: '🇵🇭 Philippines' },
    { value: 'Indonesia', label: '🇮🇩 Indonesia' },
    { value: 'Vietnam', label: '🇻🇳 Vietnam' },
    { value: 'Poland', label: '🇵🇱 Poland' },
    { value: 'Czech Republic', label: '🇨🇿 Czech Republic' },
    { value: 'Hungary', label: '🇭🇺 Hungary' },
    { value: 'Romania', label: '🇷🇴 Romania' },
    { value: 'Bulgaria', label: '🇧🇬 Bulgaria' },
    { value: 'Croatia', label: '🇭🇷 Croatia' },
    { value: 'Slovenia', label: '🇸🇮 Slovenia' },
    { value: 'Slovakia', label: '🇸🇰 Slovakia' },
    { value: 'Estonia', label: '🇪🇪 Estonia' },
    { value: 'Latvia', label: '🇱🇻 Latvia' },
    { value: 'Lithuania', label: '🇱🇹 Lithuania' },
    { value: 'Portugal', label: '🇵🇹 Portugal' },
    { value: 'Greece', label: '🇬🇷 Greece' },
    { value: 'Cyprus', label: '🇨🇾 Cyprus' },
    { value: 'Malta', label: '🇲🇹 Malta' },
    { value: 'Luxembourg', label: '🇱🇺 Luxembourg' },
    { value: 'Iceland', label: '🇮🇸 Iceland' }
  ]

  const languages = [
    { value: 'en', label: '🇺🇸 English' },
    { value: 'es', label: '🇪🇸 Spanish' },
    { value: 'fr', label: '🇫🇷 French' },
    { value: 'de', label: '🇩🇪 German' },
    { value: 'it', label: '🇮🇹 Italian' },
    { value: 'pt', label: '🇵🇹 Portuguese' },
    { value: 'ru', label: '🇷🇺 Russian' },
    { value: 'zh', label: '🇨🇳 Chinese' },
    { value: 'ja', label: '🇯🇵 Japanese' },
    { value: 'ko', label: '🇰🇷 Korean' },
    { value: 'ar', label: '🇸🇦 Arabic' },
    { value: 'other', label: '🌍 Other' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Edit Website
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Website URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website URL *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <CustomSelect
                  options={categories.map(cat => ({
                    value: cat,
                    label: cat.charAt(0).toUpperCase() + cat.slice(1)
                  }))}
                  value={formData.category}
                  onChange={(value) => handleInputChange('category', value)}
                  placeholder="Select category"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status *
                </label>
                <CustomSelect
                  options={statuses.map(status => ({
                    value: status.value,
                    label: status.label
                  }))}
                  value={formData.status}
                  onChange={(value) => handleInputChange('status', value)}
                  placeholder="Select status"
                />
              </div>

              {/* Domain Authority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Domain Authority (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.domainAuthority}
                  onChange={(e) => handleInputChange('domainAuthority', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Monthly Traffic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Traffic
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.monthlyTraffic}
                  onChange={(e) => handleInputChange('monthlyTraffic', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language *
                </label>
                <CustomSelect
                  options={languages}
                  value={formData.language}
                  onChange={(value) => handleInputChange('language', value)}
                  placeholder="Select language"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country *
                </label>
                <CustomSelect
                  options={countries}
                  value={formData.country}
                  onChange={(value) => handleInputChange('country', value)}
                  placeholder="Select country"
                />
              </div>

              {/* Guest Post Pricing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Guest Post Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricing.guestPost}
                  onChange={(e) => handleInputChange('pricing.guestPost', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Link Insertion Pricing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link Insertion Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricing.linkInsertion}
                  onChange={(e) => handleInputChange('pricing.linkInsertion', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Writing + GP Pricing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Writing + Guest Post Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricing.writingGuestPost}
                  onChange={(e) => handleInputChange('pricing.writingGuestPost', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Turnaround Time (TAT) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Turnaround Time (Days) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.turnaroundTimeDays}
                  onChange={(e) => handleInputChange('turnaroundTimeDays', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
