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
  Edit,
  Trash2,
  Filter,
  Search,
  MoreVertical
} from 'lucide-react'
import { apiService } from '@/lib/api'
import toast from 'react-hot-toast'

// Types
interface Task {
  _id: string
  advertiserId: {
    _id: string
    firstName: string
    lastName: string
    email: string
    company?: string
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
}

interface TabData {
  id: string
  label: string
  count: number
  icon: any
  color: string
}

export default function PublisherTaskManagementPage() {
  const [activeTab, setActiveTab] = useState('requested')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Tab configuration
  const tabs: TabData[] = [
    { id: 'all', label: 'All', count: 0, icon: ClipboardList, color: 'blue' },
    { id: 'requested', label: 'Request for Advertiser', count: 0, icon: AlertCircle, color: 'yellow' },
    { id: 'inProgress', label: 'In Progress', count: 0, icon: Clock, color: 'blue' },
    { id: 'advertiserApproval', label: 'Advertiser\'s Approval', count: 0, icon: User, color: 'purple' },
    { id: 'completed', label: 'Completed', count: 0, icon: CheckCircle, color: 'green' },
    { id: 'rejected', label: 'Rejected', count: 0, icon: XCircle, color: 'red' }
  ]

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Replace with actual API call when backend is ready
      // const response = await apiService.getPublisherTasks()
      // setTasks(response.data?.tasks || [])
      
      // For now, set empty array - no mock data
      setTasks([])
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }

  // Update tab counts
  const updateTabCounts = () => {
    const counts = tabs.map(tab => {
      if (tab.id === 'all') {
        return { ...tab, count: tasks.length }
      }
      return { ...tab, count: tasks.filter(task => task.status === tab.id).length }
    })
    return counts
  }

  // Filter tasks based on active tab and search
  const filteredTasks = tasks.filter(task => {
    const matchesTab = activeTab === 'all' || task.status === activeTab
    const matchesSearch = searchTerm === '' || 
      task.advertiserId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.advertiserId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.advertiserId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.websiteId.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.postId?.title && task.postId.title.toLowerCase().includes(searchTerm.toLowerCase()))
    
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

  // Handle task actions
  const handleTaskAction = async (taskId: string, action: string) => {
    try {
      // TODO: Replace with actual API calls when backend is ready
      // await apiService.updateTaskStatus(taskId, action)
      
      console.log(`Performing ${action} on task ${taskId}`)
      toast.success(`Task ${action} successfully`)
      
      // Refresh tasks after action
      await fetchTasks()
    } catch (err) {
      console.error(`Error ${action} task:`, err)
      toast.error(`Failed to ${action} task`)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const tabCounts = updateTabCounts()

  return (
    <ProtectedRoute allowedRoles={["publisher"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Task Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage advertiser orders and track progress
                </p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search tasks by advertiser, website, or post..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabCounts.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? (() => {
                              switch (tab.color) {
                                case 'blue': return 'border-blue-500 text-blue-600 dark:text-blue-400'
                                case 'yellow': return 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                                case 'purple': return 'border-purple-500 text-purple-600 dark:text-purple-400'
                                case 'green': return 'border-green-500 text-green-600 dark:text-green-400'
                                case 'red': return 'border-red-500 text-red-600 dark:text-red-400'
                                default: return 'border-gray-500 text-gray-600 dark:text-gray-400'
                              }
                            })()
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activeTab === tab.id
                            ? (() => {
                                switch (tab.color) {
                                  case 'blue': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  case 'yellow': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                  case 'purple': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                  case 'green': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  case 'red': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                }
                              })()
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}>
                          {tab.count}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Tasks List */}
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Loading tasks...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-20">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm 
                  ? 'No tasks match your search criteria. Try adjusting your search terms.' 
                  : activeTab === 'all'
                    ? 'You don\'t have any tasks yet. Tasks will appear here when advertisers place orders for your websites.'
                    : `No tasks found in "${tabs.find(t => t.id === activeTab)?.label}" status.`
                }
              </p>
              {!searchTerm && activeTab === 'all' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Getting Started:</strong> Make sure your websites are published and available for advertisers to discover and place orders.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div key={task._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Task Header */}
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(task.type)}`}>
                              {task.type === 'guestPost' ? 'Guest Post' : 
                               task.type === 'linkInsertion' ? 'Link Insertion' : 
                               'Writing + GP'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Created {formatDate(task.createdAt)}</span>
                          </div>
                        </div>

                        {/* Task Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Advertiser Info */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>Advertiser</span>
                            </h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <p className="font-medium">{task.advertiserId.firstName} {task.advertiserId.lastName}</p>
                              <p>{task.advertiserId.email}</p>
                              {task.advertiserId.company && (
                                <p className="text-xs text-gray-500">{task.advertiserId.company}</p>
                              )}
                            </div>
                          </div>

                          {/* Website Info */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                              <Globe className="w-4 h-4" />
                              <span>Website</span>
                            </h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <p className="font-medium">{task.websiteId.domain}</p>
                              <p className="text-xs text-gray-500">{task.websiteId.url}</p>
                            </div>
                          </div>

                          {/* Post Info */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                              <FileText className="w-4 h-4" />
                              <span>Post</span>
                            </h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {task.postId ? (
                                <>
                                  <p className="font-medium">{task.postId.title}</p>
                                  <p className="text-xs text-gray-500">Post ID: {task.postId._id}</p>
                                </>
                              ) : (
                                <p className="text-gray-500 italic">No post assigned</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Requirements and Notes */}
                        {(task.requirements || task.notes) && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {task.requirements && (
                                <div>
                                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Requirements</h5>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    {task.requirements.minWordCount && (
                                      <p>Min words: {task.requirements.minWordCount.toLocaleString()}</p>
                                    )}
                                    {task.requirements.maxLinks && (
                                      <p>Max links: {task.requirements.maxLinks}</p>
                                    )}
                                    {task.requirements.deadline && (
                                      <p>Deadline: {formatDate(task.requirements.deadline)}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                              {task.notes && (
                                <div>
                                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</h5>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{task.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Price */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white">
                              <DollarSign className="w-5 h-5" />
                              <span>${task.price.toFixed(2)}</span>
                            </div>
                            {task.completedAt && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Completed: {formatDate(task.completedAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="ml-6 flex items-center space-x-2">
                        <button
                          onClick={() => {/* View task details */}}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {/* Edit task */}}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Edit Task"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="More Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
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