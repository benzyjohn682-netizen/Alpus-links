"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { apiService } from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Edit, Trash2, Key, Mail, Phone, Calendar, Shield, Activity, Globe, User, Clock } from 'lucide-react'

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
  phone?: string
  website?: string
  bio?: string
  location?: string
  timezone?: string
  twoFactorEnabled?: boolean
  emailVerified?: boolean
  loginCount?: number
  lastIpAddress?: string
  userAgent?: string
}

interface UserActivity {
  _id: string
  type: string
  description: string
  timestamp: string
  ipAddress?: string
  userAgent?: string
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [passwordChanging, setPasswordChanging] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    website: '',
    bio: '',
    location: '',
    timezone: '',
    status: ''
  })
  
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
    currentPassword: ''
  })

  useEffect(() => {
    if (userId) {
      loadUser()
      loadUserActivities()
    }
  }, [userId])

  const loadUser = async () => {
    try {
      setLoading(true)
      const response = await apiService.getUserById(userId)
      const userData = response.data as User
      
      if (userData) {
        setUser(userData)
        setEditForm({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          website: userData.website || '',
          bio: userData.bio || '',
          location: userData.location || '',
          timezone: userData.timezone || '',
          status: userData.status || 'active'
        })
      }
    } catch (err: any) {
      console.error('Failed to load user:', err)
      toast.error(err?.message || 'Failed to load user details')
      router.push('/alpus-admin/users/all')
    } finally {
      setLoading(false)
    }
  }

  const loadUserActivities = async () => {
    try {
      const response = await apiService.getUserActivities(userId)
      const activitiesData = response.data
      
      if (Array.isArray(activitiesData)) {
        setActivities(activitiesData)
      }
    } catch (err: any) {
      console.error('Failed to load user activities:', err)
    }
  }

  const handleUpdate = async () => {
    if (!user) return

    try {
      setSaving(true)
      await apiService.updateUser(user._id, editForm)
      toast.success('User updated successfully')
      loadUser()
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = () => {
    setDeleting(true)
  }

  const handleDeleteConfirm = async () => {
    if (!user) return

    try {
      await apiService.deleteUser(user._id)
      toast.success('User deleted successfully')
      router.push('/alpus-admin/users/all')
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Failed to delete user')
    }
  }

  const handleDeleteCancel = () => {
    setDeleting(false)
  }

  const handlePasswordClick = () => {
    setPasswordChanging(true)
    setPasswordForm({ newPassword: '', confirmPassword: '', currentPassword: '' })
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    try {
      const updateData: any = {
        newPassword: passwordForm.newPassword
      }
      
      if (passwordForm.currentPassword) {
        updateData.currentPassword = passwordForm.currentPassword
      }

      await apiService.updateUser(user._id, updateData)
      toast.success('Password updated successfully')
      setPasswordChanging(false)
      setPasswordForm({ newPassword: '', confirmPassword: '', currentPassword: '' })
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Failed to update password')
    }
  }

  const handlePasswordCancel = () => {
    setPasswordChanging(false)
    setPasswordForm({ newPassword: '', confirmPassword: '', currentPassword: '' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["super admin", "admin"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading user details...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!user) {
    return (
      <ProtectedRoute allowedRoles={["super admin", "admin"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">User Not Found</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">The user you're looking for doesn't exist.</p>
              <button
                onClick={() => router.push('/alpus-admin/users/all')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Users
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["super admin", "admin"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/alpus-admin/users/all')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">User Details & Activity</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handlePasswordClick}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Basic Information</h2>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      {user?.emailVerified && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 dark:text-white">{user?.role?.name || 'No role assigned'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Member Since</label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 dark:text-white">{user ? formatDate(user.createdAt) : ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Additional Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
                    <input
                      type="url"
                      value={editForm.website}
                      onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="City, Country"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
                    <input
                      type="text"
                      value={editForm.timezone}
                      onChange={(e) => setEditForm({...editForm, timezone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="UTC+0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              </div>

              {/* Security Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Security & Activity</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User Status</label>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Two-Factor Authentication</label>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${user?.twoFactorEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <p className="text-gray-900 dark:text-white">
                        {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Login Count</label>
                    <p className="text-gray-900 dark:text-white">{user?.loginCount || 0} times</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Login</label>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 dark:text-white">
                        {user?.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Status</label>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${user?.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <p className="text-gray-900 dark:text-white">
                        {user?.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  {user?.lastIpAddress && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last IP Address</label>
                      <p className="text-gray-900 dark:text-white font-mono text-sm">{user.lastIpAddress}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
                
                {activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.slice(0, 10).map((activity) => (
                      <div key={activity._id} className="border-l-2 border-blue-500 pl-4">
                        <p className="text-sm text-gray-900 dark:text-white">{activity.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(activity.timestamp)}
                        </p>
                        {activity.ipAddress && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                            {activity.ipAddress}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Delete Confirmation Modal */}
        {deleting && (
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
                  Are you sure you want to delete <strong>{user.firstName} {user.lastName}</strong>? 
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
        {passwordChanging && (
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
                  Update password for <strong>{user.firstName} {user.lastName}</strong>
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
      </div>
    </ProtectedRoute>
  )
}
