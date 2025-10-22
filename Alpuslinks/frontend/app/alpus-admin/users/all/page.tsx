"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { apiService } from '@/lib/api'
import toast from 'react-hot-toast'
import { Edit, Trash2, Search, Filter, Key, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import CustomSelect from '@/components/ui/custom-select'
import { SimpleSelect } from '@/components/ui/simple-select'

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  role?: {
    _id: string
    name: string
  }
  status: string
  lastLogin?: string
  isOnline?: boolean
  lastActiveLogin?: string
  createdAt: string
}

export default function AllUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [roles, setRoles] = useState<any[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [passwordUser, setPasswordUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    status: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
    currentPassword: ''
  })
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isSelectAll, setIsSelectAll] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [userStats, setUserStats] = useState<any>(null)

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [currentPage, pageSize, search, roleFilter, statusFilter])

  useEffect(() => {
    loadUserStats()
  }, [])

  // Update select all state when individual selections change
  useEffect(() => {
    if (users.length > 0) {
      const allSelected = users.every(user => selectedUsers.includes(user._id))
      if (allSelected !== isSelectAll) {
        setIsSelectAll(allSelected)
      }
    } else if (isSelectAll) {
      setIsSelectAll(false)
    }
  }, [selectedUsers, users, isSelectAll])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await apiService.getUsers(currentPage, pageSize, search, roleFilter, statusFilter)
      
      // Safely handle the response data
      const usersData = (response.data as any)?.users
      const paginationData = (response.data as any)?.pagination
      
      if (Array.isArray(usersData)) {
        setUsers(usersData)
      } else {
        console.warn('Invalid users data received:', usersData)
        setUsers([])
      }
      
      if (paginationData?.pages && typeof paginationData.pages === 'number') {
        setTotalPages(paginationData.pages)
      } else {
        setTotalPages(1)
      }
      
      if (paginationData?.total !== undefined) {
        setTotalCount(paginationData.total)
      }
    } catch (err) {
      console.error('Failed to load users:', err)
      toast.error('Failed to load users')
      setUsers([])
      setTotalPages(1)
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await apiService.getRoles()
      const rolesData = (response.data as any)?.roles
      
      if (Array.isArray(rolesData)) {
        setRoles(rolesData)
      } else {
        console.warn('Invalid roles data received:', rolesData)
        setRoles([])
      }
    } catch (err) {
      console.error('Failed to load roles:', err)
      setRoles([])
    }
  }

  const loadUserStats = async () => {
    try {
      const response = await apiService.getUserStats()
      setUserStats((response.data as any) || null)
    } catch (err) {
      console.error('Failed to load user stats:', err)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role?._id || '',
      status: user.status
    })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      await apiService.updateUser(editingUser._id, editForm)
      toast.success('User updated successfully')
      setEditingUser(null)
      loadUsers()
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Failed to update user')
    }
  }

  const handleDeleteClick = (user: User) => {
    setDeletingUser(user)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return

    try {
      await apiService.deleteUser(deletingUser._id)
      toast.success('User deleted successfully')
      setDeletingUser(null)
      loadUsers()
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Failed to delete user')
    }
  }

  const handleDeleteCancel = () => {
    setDeletingUser(null)
  }

  const handlePasswordClick = (user: User) => {
    setPasswordUser(user)
    setPasswordForm({ newPassword: '', confirmPassword: '', currentPassword: '' })
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordUser) return

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    try {
      // For super admin, we don't need current password
      const updateData: any = {
        newPassword: passwordForm.newPassword
      }
      
      // Only add current password if it's provided (for non-super admin users)
      if (passwordForm.currentPassword) {
        updateData.currentPassword = passwordForm.currentPassword
      }

      await apiService.updateUser(passwordUser._id, updateData)
      toast.success('Password updated successfully')
      setPasswordUser(null)
      setPasswordForm({ newPassword: '', confirmPassword: '', currentPassword: '' })
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Failed to update password')
    }
  }

  const handlePasswordCancel = () => {
    setPasswordUser(null)
    setPasswordForm({ newPassword: '', confirmPassword: '', currentPassword: '' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Build a compact page list with ellipses for large page counts
  const getPageNumbers = (total: number, current: number) => {
    const pages: number[] = []
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i)
      return pages
    }
    const add = (n: number) => { if (!pages.includes(n)) pages.push(n) }
    add(1)
    const left = Math.max(2, current - 1)
    const right = Math.min(total - 1, current + 1)
    if (left > 2) add(-1) // ellipsis
    for (let i = left; i <= right; i++) add(i)
    if (right < total - 1) add(-1) // ellipsis
    add(total)
    return pages
  }

  // Bulk selection handlers
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (isSelectAll || selectedUsers.length === users.length) {
      setSelectedUsers([])
      setIsSelectAll(false)
    } else {
      const allUserIds = users.map(user => user._id)
      setSelectedUsers(allUserIds)
      setIsSelectAll(true)
    }
  }

  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) return
    setShowBulkDeleteModal(true)
  }

  const handleBulkDeleteConfirm = async () => {
    try {
      setLoading(true)
      console.log('Attempting bulk delete with user IDs:', selectedUsers)
      const response = await apiService.bulkDeleteUsers(selectedUsers)
      
      if (response.data) {
        setUsers(prev => prev.filter(user => !selectedUsers.includes(user._id)))
        setSelectedUsers([])
        setIsSelectAll(false)
        setShowBulkDeleteModal(false)
        toast.success(`Successfully deleted ${selectedUsers.length} user(s)!`)
      }
    } catch (err: any) {
      console.error('Bulk delete error:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to delete selected users'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteModal(false)
  }

  const handleBulkStatusChange = async (status: string) => {
    if (selectedUsers.length === 0) return

    try {
      setLoading(true)
      const response = await apiService.bulkUpdateUserStatus(selectedUsers, status)
      
      if (response.data) {
        setUsers(prev => 
          prev.map(user => 
            selectedUsers.includes(user._id) 
              ? { ...user, status: status as any }
              : user
          )
        )
        setSelectedUsers([])
        setIsSelectAll(false)
        toast.success(`Successfully updated ${selectedUsers.length} user(s) status to ${status}!`)
      }
    } catch (err: any) {
      console.error('Bulk status change error:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update selected users status'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleUserNameClick = (userId: string) => {
    router.push(`/alpus-admin/users/${userId}`)
  }

  return (
    <ProtectedRoute allowedRoles={["super admin", "admin"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
        <div className="max-w-8xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and monitor all users in the system</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span>{users.length} users</span>
                </div>
              </div>

              {/* User Overview Stats */}
              {userStats ? (
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Users */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium">Total Users</p>
                          <p className="text-3xl font-bold">{userStats.overview?.total || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Active Users */}
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium">Active Users</p>
                          <p className="text-3xl font-bold">{userStats.overview?.active || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Recent Users (30 days) */}
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm font-medium">New Users (30d)</p>
                          <p className="text-3xl font-bold">{userStats.overview?.recent || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Today's Logged In Users */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm font-medium">Today's Logged In</p>
                          <p className="text-3xl font-bold">{userStats.overview?.todayLoggedIn || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-400 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Stats Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    {/* Status Breakdown */}
                    <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Status</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                            <span className="text-gray-600 dark:text-gray-300">Active</span>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">{userStats.overview?.active || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                            <span className="text-gray-600 dark:text-gray-300">Inactive</span>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">{userStats.overview?.inactive || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                            <span className="text-gray-600 dark:text-gray-300">Suspended</span>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">{userStats.overview?.suspended || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Role Distribution */}
                    <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Role Distribution</h3>
                      <div className="space-y-3">
                        {userStats.roles?.map((role: any, index: number) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-300 capitalize">{role._id}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{role.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Growth Metrics */}
                    <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Growth Metrics</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-300">This Week</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{userStats.overview?.weekly || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-300">This Month</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{userStats.overview?.recent || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Today's Signups</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{userStats.overview?.today || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Today's Logged In</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{userStats.overview?.todayLoggedIn || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading user statistics...</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Enhanced Filters */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Search Section */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search Users
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search by name, email, or role..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Filters Section */}
                  <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
                    {/* Role Filter */}
                    <div className="min-w-[160px]">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Role
                      </label>
                      <CustomSelect
                        options={[
                          { value: '', label: 'All Roles' },
                          ...roles.map(role => ({ value: role._id, label: role.name }))
                        ]}
                        value={roleFilter}
                        onChange={setRoleFilter}
                        placeholder="All Roles"
                      />
                    </div>
                    
                    {/* Status Filter */}
                    <div className="min-w-[160px]">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <CustomSelect
                        options={[
                          { value: '', label: 'All Status' },
                          { value: 'active', label: '✅ Active' },
                          { value: 'inactive', label: '⏸️ Inactive' },
                          { value: 'suspended', label: '🚫 Suspended' }
                        ]}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        placeholder="All Status"
                      />
                    </div>
                  </div>
                </div>

                {/* Filter Summary */}
                {(search || roleFilter || statusFilter) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                      {search && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Search: "{search}"
                          <button
                            onClick={() => setSearch('')}
                            className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {roleFilter && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Role: {roles.find(r => r._id === roleFilter)?.name || 'Unknown'}
                          <button
                            onClick={() => setRoleFilter('')}
                            className="ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {statusFilter && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Status: {statusFilter}
                          <button
                            onClick={() => setStatusFilter('')}
                            className="ml-2 text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setSearch('')
                          setRoleFilter('')
                          setStatusFilter('')
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-200 dark:border-blue-800">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                          {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''} Selected
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Choose an action to apply to all selected users
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleBulkStatusChange('active')}
                        className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Activate Selected
                      </button>
                      <button
                        onClick={() => handleBulkStatusChange('inactive')}
                        className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Deactivate Selected
                      </button>
                      <button
                        onClick={() => handleBulkStatusChange('suspended')}
                        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                        </svg>
                        Suspend Selected
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Selected
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUsers([])
                          setIsSelectAll(false)
                        }}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear Selection
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={isSelectAll}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Login State
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user._id)}
                            onChange={() => handleSelectUser(user._id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleUserNameClick(user._id)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100 hover:underline cursor-pointer transition-all duration-200 bg-transparent border-none p-0 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-1 py-0.5 -mx-1 -my-0.5 flex items-center gap-1"
                          >
                            {user.firstName || ''} {user.lastName || ''}
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {user.email || 'No Email'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {user.role?.name || 'No Role'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status || 'inactive')}`}>
                            {user.status || 'inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="text-sm">
                              {user.isOnline ? (
                                <div className="flex flex-col">
                                  <span className="font-medium text-green-600 dark:text-green-400">Online</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Since {user.lastActiveLogin ? new Date(user.lastActiveLogin).toLocaleDateString() : 'Unknown'}
                                  </span>
                                </div>
                              ) : (user.lastActiveLogin || user.lastLogin) ? (
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-600 dark:text-gray-400">Offline</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Last seen {new Date(user.lastActiveLogin || user.lastLogin || '').toLocaleDateString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400">Never logged in</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePasswordClick(user)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Change Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Show:</span>
                      <SimpleSelect
                        value={String(pageSize)}
                        onChange={(value) => {
                          setPageSize(parseInt(value) || 10)
                          setCurrentPage(1)
                        }}
                        options={[
                          { value: '5', label: '5' },
                          { value: '10', label: '10' },
                          { value: '20', label: '20' },
                          { value: '50', label: '50' }
                        ]}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">per page</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing{' '}
                        <span className="font-medium">
                          {Math.min((currentPage - 1) * pageSize + 1, Math.max(totalCount, 0))}
                        </span>
                        {' '}to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * pageSize, totalCount)}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium">{totalCount}</span>
                        {' '}results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className={`p-2 rounded-full transition-colors ${currentPage === 1 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        {getPageNumbers(totalPages, currentPage).map((page, idx) => (
                          page === -1 ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-white'
                                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        ))}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className={`p-2 rounded-full transition-colors ${currentPage === totalPages ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                          aria-label="Next page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Edit User
              </h2>
              
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Delete User
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Are you sure you want to delete <strong>{deletingUser.firstName} {deletingUser.lastName}</strong>? 
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
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {passwordUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <Key className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Change Password
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update password for <strong>{passwordUser.firstName} {passwordUser.lastName}</strong>
                </p>
              </div>

              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter current password (optional for super admin)"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Super admin can reset passwords without current password
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handlePasswordCancel}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Delete Users
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Are you sure you want to delete <strong>{selectedUsers.length} user(s)</strong>? 
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
                  Delete {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
