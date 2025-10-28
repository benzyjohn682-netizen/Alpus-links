"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useState, useEffect } from 'react'
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Calendar,
  DollarSign,
  Globe,
  FileText,
  Eye,
  Filter,
  Search
} from 'lucide-react'
import { apiService } from '@/lib/api'
import toast from 'react-hot-toast'

// Types
interface Order {
  _id: string
  publisherId: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  websiteId: {
    _id: string
    domain: string
    url: string
  }
  postId?: {
    _id: string
    title: string
    content?: string
  }
  linkInsertionId?: {
    _id: string
    anchorText: string
    anchorUrl: string
  }
  type: 'guestPost' | 'linkInsertion' | 'writingGuestPost'
  status: 'requested' | 'inProgress' | 'advertiserApproval' | 'completed' | 'rejected'
  price: number
  requirements?: {
    minWordCount?: number
    maxLinks?: number
    allowedTopics?: string[]
    prohibitedTopics?: string[]
    deadline?: string
  }
  notes?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  rejectionReason?: string
  timeline?: Array<{
    status: string
    timestamp: string
    note?: string
    updatedBy?: string
  }>
}

interface TabData {
  id: string
  label: string
  count: number
  icon: any
  color: string
}

export default function AdvertiserOrdersPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Tab configuration
  const tabs: TabData[] = [
    { id: 'all', label: 'All Orders', count: 0, icon: ClipboardList, color: 'blue' },
    { id: 'requested', label: 'Requested', count: 0, icon: AlertCircle, color: 'yellow' },
    { id: 'inProgress', label: 'In Progress', count: 0, icon: Clock, color: 'blue' },
    { id: 'advertiserApproval', label: 'Pending Approval', count: 0, icon: User, color: 'purple' },
    { id: 'completed', label: 'Completed', count: 0, icon: CheckCircle, color: 'green' },
    { id: 'rejected', label: 'Rejected', count: 0, icon: XCircle, color: 'red' }
  ]

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.getAdvertiserOrders({
        status: activeTab === 'all' ? undefined : activeTab
      })
      
      if (response.data?.success) {
        setOrders(response.data.data.orders || [])
      } else {
        throw new Error(response.data?.message || 'Failed to fetch orders')
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  // Update tab counts
  const updateTabCounts = () => {
    const counts = tabs.map(tab => {
      if (tab.id === 'all') {
        return { ...tab, count: orders.length }
      }
      return { ...tab, count: orders.filter(order => order.status === tab.id).length }
    })
    return counts
  }

  // Filter orders based on active tab and search
  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'all' || order.status === activeTab
    const matchesSearch = searchTerm === '' ||
      order.publisherId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.publisherId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.publisherId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.websiteId.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.postId?.title && order.postId.title.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesTab && matchesSearch
  })

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'inProgress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'advertiserApproval': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guestPost': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'linkInsertion': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'writingGuestPost': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Handle order approval/rejection
  const handleOrderAction = async (orderId: string, action: 'approve' | 'reject') => {
    try {
      const newStatus = action === 'approve' ? 'completed' : 'rejected'
      const note = action === 'approve' ? 'Order approved by advertiser' : 'Order rejected by advertiser'
      
      const response = await apiService.updateOrderStatus(orderId, newStatus, note)
      
      if (response.data?.success) {
        toast.success(`Order ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
        fetchOrders()
      } else {
        throw new Error(response.data?.message || 'Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update order status')
    }
  }

  // Fetch orders on component mount and when dependencies change
  useEffect(() => {
    fetchOrders()
  }, [activeTab])

  const tabCounts = updateTabCounts()

  return (
    <ProtectedRoute allowedRoles={["advertiser"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  My Orders
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Track and manage your placed orders
                </p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Responsive Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700">
              {/* Desktop Layout with Scrollable Tabs */}
              <nav className="hidden md:block" aria-label="Tabs">
                <div className="overflow-x-auto px-6">
                  <div className="flex min-w-max">
                    {tabCounts.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center space-x-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id
                              ? `border-${tab.color}-500 text-${tab.color}-600 dark:text-${tab.color}-400`
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                          <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${
                            activeTab === tab.id
                              ? `bg-${tab.color}-100 text-${tab.color}-800 dark:bg-${tab.color}-900/30 dark:text-${tab.color}-300`
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </nav>

              {/* Mobile Layout */}
              <div className="md:hidden">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full px-4 py-3 text-sm font-medium bg-transparent border-0 focus:ring-0 dark:text-white"
                >
                  {tabCounts.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label} ({tab.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading orders...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error loading orders</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
                <button
                  onClick={fetchOrders}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm 
                    ? 'No orders match your search criteria. Try adjusting your search terms.' 
                    : activeTab === 'all'
                      ? 'You haven\'t placed any orders yet. Start by adding items to your cart and placing an order.'
                      : `No orders found in "${tabs.find(t => t.id === activeTab)?.label}" status.`
                  }
                </p>
                {!searchTerm && activeTab === 'all' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Getting Started:</strong> Browse available websites and add services to your cart to place orders.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Order Header */}
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </span>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(order.type)}`}>
                                {order.type === 'guestPost' ? 'Guest Post' : 
                                 order.type === 'linkInsertion' ? 'Link Insertion' : 
                                 'Writing + GP'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>Created {formatDate(order.createdAt)}</span>
                            </div>
                          </div>

                          {/* Order Content */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Publisher Info */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>Publisher</span>
                              </h4>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                <p className="font-medium">{order.publisherId.firstName} {order.publisherId.lastName}</p>
                                <p>{order.publisherId.email}</p>
                              </div>
                            </div>

                            {/* Website Info */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                                <Globe className="w-4 h-4" />
                                <span>Website</span>
                              </h4>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                <p className="font-medium">{order.websiteId.domain}</p>
                                <p className="text-xs text-gray-500">{order.websiteId.url}</p>
                              </div>
                            </div>

                            {/* Post Info */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                                <FileText className="w-4 h-4" />
                                <span>Post</span>
                              </h4>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {order.postId ? (
                                  <>
                                    <p className="font-medium">{order.postId.title}</p>
                                    <p className="text-xs text-gray-500">Post ID: {order.postId._id}</p>
                                  </>
                                ) : order.linkInsertionId ? (
                                  <>
                                    <p className="font-medium">{order.linkInsertionId.anchorText}</p>
                                    <p className="text-xs text-gray-500">Link: {order.linkInsertionId.anchorUrl}</p>
                                  </>
                                ) : (
                                  <p className="text-gray-500 italic">No content assigned</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white">
                                <DollarSign className="w-5 h-5" />
                                <span>${order.price.toFixed(2)}</span>
                              </div>
                              {order.completedAt && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Completed: {formatDate(order.completedAt)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Rejection Reason */}
                          {order.status === 'rejected' && order.rejectionReason && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                <h5 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Rejection Reason</h5>
                                <p className="text-sm text-red-700 dark:text-red-400">{order.rejectionReason}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="ml-6 flex items-center space-x-2">
                          {order.status === 'advertiserApproval' && (
                            <>
                              <button
                                onClick={() => handleOrderAction(order._id, 'approve')}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleOrderAction(order._id, 'reject')}
                                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => {/* View order details */}}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}