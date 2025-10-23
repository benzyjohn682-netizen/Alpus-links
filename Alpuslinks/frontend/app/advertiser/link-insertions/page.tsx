"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit3, Trash2, Eye, ExternalLink, Link, Calendar, Filter, Search } from 'lucide-react'
import { apiService } from '@/lib/api'
import toast from 'react-hot-toast'

interface LinkInsertion {
  id: string
  postUrl: string
  anchorText: string
  anchorUrl: string
  currentText: string
  fixedText: string
  addingText: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

export default function LinkInsertionsPage() {
  const router = useRouter()
  const [linkInsertions, setLinkInsertions] = useState<LinkInsertion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Load link insertions
  useEffect(() => {
    const loadLinkInsertions = async () => {
      try {
        setLoading(true)
        const { data } = await apiService.getLinkInsertions({
          search: searchTerm,
          status: statusFilter === 'all' ? undefined : statusFilter,
          sortBy,
          sortOrder
        })
        setLinkInsertions((data as any)?.linkInsertions || [])
      } catch (error: any) {
        console.error('Load error:', error)
        toast.error(error?.message || 'Failed to load link insertions')
      } finally {
        setLoading(false)
      }
    }
    
    loadLinkInsertions()
  }, [searchTerm, statusFilter, sortBy, sortOrder])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link insertion?')) return
    
    try {
      await apiService.deleteLinkInsertion(id)
      setLinkInsertions(prev => prev.filter(li => li.id !== id))
      toast.success('Link insertion deleted')
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error?.message || 'Failed to delete link insertion')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return '📝'
      case 'pending': return '⏳'
      case 'approved': return '✅'
      case 'rejected': return '❌'
      default: return '📝'
    }
  }

  const filteredLinkInsertions = linkInsertions.filter(li => {
    const matchesSearch = !searchTerm || 
      li.postUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      li.anchorText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      li.anchorUrl.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || li.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <ProtectedRoute allowedRoles={["advertiser"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Link Insertions
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your link insertion requests
                </p>
              </div>
              <button
                onClick={() => router.push('/advertiser/link-insertions/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>Create New</span>
              </button>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search link insertions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                />
              </div>
              
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-')
                    setSortBy(field)
                    setSortOrder(order as 'asc' | 'desc')
                  }}
                  className="px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                >
                  <option value="updatedAt-desc">Newest First</option>
                  <option value="updatedAt-asc">Oldest First</option>
                  <option value="createdAt-desc">Recently Created</option>
                  <option value="status-asc">Status A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Link Insertions List */}
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Loading link insertions...</p>
            </div>
          ) : filteredLinkInsertions.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Link className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No link insertions found
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first link insertion request'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => router.push('/advertiser/link-insertions/create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create First Link Insertion</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredLinkInsertions.map((li) => (
                <div
                  key={li.id}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/50 overflow-hidden hover:shadow-3xl transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {li.anchorText}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(li.status)}`}>
                            <span>{getStatusIcon(li.status)}</span>
                            <span>{li.status.charAt(0).toUpperCase() + li.status.slice(1)}</span>
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <ExternalLink className="w-4 h-4" />
                            <span className="truncate">Post: {li.postUrl}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Link className="w-4 h-4" />
                            <span className="truncate">Link: {li.anchorUrl}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>Updated: {new Date(li.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => router.push(`/advertiser/link-insertions/edit/${li.id}`)}
                          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200"
                          title="Edit link insertion"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(li.id)}
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                          title="Delete link insertion"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Preview of text content */}
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Current Text:</h4>
                          <p className="text-gray-600 dark:text-gray-400 line-clamp-3">{li.currentText}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Fixed Text:</h4>
                          <p className="text-gray-600 dark:text-gray-400 line-clamp-3">{li.fixedText}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Adding Text:</h4>
                          <p className="text-gray-600 dark:text-gray-400 line-clamp-3">{li.addingText}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
