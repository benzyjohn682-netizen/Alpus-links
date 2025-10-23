"use client"
import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { apiService } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { CustomFilterSelect } from '@/components/ui/custom-filter-select'
import { EditRoleModal } from '@/components/roles/EditRoleModal'
import toast from 'react-hot-toast'

interface Role {
  _id: string
  name: string
  permissions: string[]
  color: string
  isActive: boolean
  isSystem: boolean
  userCount: number
  createdAt: string
  updatedAt: string
  createdBy?: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  updatedBy?: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface RoleStats {
  total: number
  active: number
  inactive: number
  system: number
  custom: number
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [stats, setStats] = useState<RoleStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<string>('all')

  const loadRoles = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.getAllRoles()
      
      if (response.data) {
        setRoles((response.data as any).roles || [])
        calculateStats((response.data as any).roles || [])
      } else {
        setRoles([])
      }
    } catch (err) {
      console.error('Error loading roles:', err)
      setError(err instanceof Error ? err.message : 'Failed to load roles')
      setRoles([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (rolesData: Role[]) => {
    const stats = {
      total: rolesData.length,
      active: rolesData.filter(role => role.isActive).length,
      inactive: rolesData.filter(role => !role.isActive).length,
      system: rolesData.filter(role => role.isSystem).length,
      custom: rolesData.filter(role => !role.isSystem).length
    }
    setStats(stats)
  }

  useEffect(() => {
    loadRoles()
  }, [])

  const handleDeleteRole = (role: Role) => {
    console.log('Attempting to delete role:', {
      id: role._id,
      name: role.name,
      isSystem: role.isSystem,
      userCount: role.userCount,
      canDelete: !role.isSystem && role.userCount === 0
    })
    setDeletingRole(role)
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingRole) return

    try {
      setError(null)
      const response = await apiService.deleteRole(deletingRole._id)
      
      if (response.data) {
        setRoles(prev => prev.filter(role => role._id !== deletingRole._id))
        toast.success('Role deleted successfully!')
        setDeletingRole(null)
        loadRoles() // Refresh to update stats
      } else {
        setError('No data received from server')
      }
    } catch (err) {
      console.error('Delete role error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleDeleteCancel = () => {
    setDeletingRole(null)
  }

  const handleEditCancel = () => {
    setEditingRole(null)
  }

  const handleToggleActive = async (role: Role) => {
    try {
      await apiService.updateRole(role._id, { isActive: !role.isActive })
      setRoles(prev => 
        prev.map(r => 
          r._id === role._id ? { ...r, isActive: !r.isActive } : r
        )
      )
      toast.success(`Role ${!role.isActive ? 'activated' : 'deactivated'} successfully!`)
      loadRoles() // Refresh to update stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role status')
    }
  }

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && role.isActive) ||
                         (filterActive === 'inactive' && !role.isActive) ||
                         (filterActive === 'system' && role.isSystem) ||
                         (filterActive === 'custom' && !role.isSystem)
    return matchesSearch && matchesFilter
  })


  if (loading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading roles...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["super admin", "admin"]}>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Role Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage user roles and permissions
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Success banner removed: using toast notifications instead */}

        {/* Stats Overview */}
        {stats && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Roles</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
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
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.active}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.inactive}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.system}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Custom</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.custom}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search Section */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Roles
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Filter and Add Button */}
              <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
                {/* Custom Filter Select */}
                <div className="min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filter Roles
                  </label>
                  <CustomFilterSelect
                    value={filterActive}
                    onChange={setFilterActive}
                    options={[
                      { value: 'all', label: 'All Roles', icon: '👥', count: roles.length },
                      { value: 'active', label: 'Active', icon: '✅', count: roles.filter(r => r.isActive).length },
                      { value: 'inactive', label: 'Inactive', icon: '⏸️', count: roles.filter(r => !r.isActive).length },
                      { value: 'system', label: 'System', icon: '🔒', count: roles.filter(r => r.isSystem).length },
                      { value: 'custom', label: 'Custom', icon: '🛠️', count: roles.filter(r => !r.isSystem).length }
                    ]}
                  />
                </div>

                {/* Add Role Button */}
                <div className="flex items-end">
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Role
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roles Table */}
        <RolesTable
          roles={filteredRoles}
          loading={loading}
          onDelete={handleDeleteRole}
          onEdit={handleEditRole}
          onToggleActive={handleToggleActive}
        />

        {/* Add Role Modal */}
        {showAddModal && (
          <AddRoleModal
            onSave={async (roleData) => {
              try {
                const response = await apiService.createRole(roleData)
                if (response.data) {
                  setRoles(prev => [...prev, (response.data as any).role])
                  toast.success('Role created successfully!')
                  setShowAddModal(false)
                  loadRoles() // Refresh to update stats
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to create role')
              }
            }}
            onCancel={() => setShowAddModal(false)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deletingRole && (
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
                  Delete Role
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Are you sure you want to delete <strong>{deletingRole.name}</strong>? 
                </p>
                {deletingRole.isSystem && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-sm text-yellow-700 dark:text-yellow-300">
                        Warning: This is a system role. Deleting it may affect system functionality.
                      </span>
                    </div>
                  </div>
                )}
                {deletingRole.userCount > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-sm text-yellow-700 dark:text-yellow-300">
                        This role is currently assigned to {deletingRole.userCount} user(s) and cannot be deleted.
                      </span>
                    </div>
                  </div>
                )}
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
                  disabled={deletingRole.userCount > 0}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingRole.userCount > 0 ? 'Cannot Delete (Has Users)' : 
                   'Delete Role'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Role Modal */}
        {editingRole && (
          <EditRoleModal
            role={editingRole}
            onSave={async (roleData) => {
              try {
                const response = await apiService.updateRole(editingRole._id, roleData)
                if (response.data) {
                  setRoles(prev => prev.map(role => 
                    role._id === editingRole._id 
                      ? { ...role, ...roleData }
                      : role
                  ))
                  toast.success('Role updated successfully!')
                  setEditingRole(null)
                  loadRoles() // Refresh to update stats
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to update role')
              }
            }}
            onCancel={handleEditCancel}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}

// Roles Table Component
interface RolesTableProps {
  roles: Role[]
  loading: boolean
  onDelete: (role: Role) => void
  onEdit: (role: Role) => void
  onToggleActive: (role: Role) => void
}

function RolesTable({ roles, loading, onDelete, onEdit, onToggleActive }: RolesTableProps) {
  const getPermissionLabel = (permission: string) => {
    const labels: { [key: string]: string } = {
      'user_management': 'User Management',
      'role_management': 'Role Management',
      'system_settings': 'System Settings',
      'data_export': 'Data Export',
      'content_moderation': 'Content Moderation',
      'reports': 'Reports',
      'profile_edit': 'Profile Edit',
      'view_content': 'View Content',
      'admin_panel': 'Admin Panel',
      'user_creation': 'User Creation',
      'user_deletion': 'User Deletion',
      'user_edit': 'User Edit',
      'role_creation': 'Role Creation',
      'role_deletion': 'Role Deletion',
      'role_edit': 'Role Edit',
      'support_tickets': 'Support Tickets'
    }
    return labels[permission] || permission
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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

  if (roles.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No roles found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            No roles match your current filters.
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
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Permissions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Users
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {roles.map((role) => (
              <tr key={role._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: role.color }}
                    ></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {role.name}
                        {role.isSystem && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            System
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {role.permissions.length} permissions
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permission, index) => (
                      <span
                        key={index}
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {getPermissionLabel(permission)}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        +{role.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {role.userCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    role.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(role.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onEdit(role)}
                      className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onToggleActive(role)}
                      className={`text-xs px-3 py-1 rounded ${
                        role.isActive
                          ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                          : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'
                      }`}
                    >
                      {role.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => onDelete(role)}
                      disabled={role.userCount > 0}
                      className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                      title={role.userCount > 0 ? `Cannot delete: ${role.userCount} user(s) assigned` : 'Delete role'}
                    >
                      {role.userCount > 0 ? `Delete (${role.userCount})` : 'Delete'}
                    </button>
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

// Add Role Modal Component
interface AddRoleModalProps {
  onSave: (roleData: any) => void
  onCancel: () => void
}

function AddRoleModal({ onSave, onCancel }: AddRoleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    permissions: [] as string[],
    color: '#3B82F6'
  })

  const [loading, setLoading] = useState(false)

  const availablePermissions = [
    { value: 'user_management', label: 'User Management' },
    { value: 'role_management', label: 'Role Management' },
    { value: 'system_settings', label: 'System Settings' },
    { value: 'data_export', label: 'Data Export' },
    { value: 'content_moderation', label: 'Content Moderation' },
    { value: 'reports', label: 'Reports' },
    { value: 'profile_edit', label: 'Profile Edit' },
    { value: 'view_content', label: 'View Content' },
    { value: 'admin_panel', label: 'Admin Panel' },
    { value: 'user_creation', label: 'User Creation' },
    { value: 'user_deletion', label: 'User Deletion' },
    { value: 'user_edit', label: 'User Edit' },
    { value: 'role_creation', label: 'Role Creation' },
    { value: 'role_deletion', label: 'Role Deletion' },
    { value: 'role_edit', label: 'Role Edit' },
    { value: 'support_tickets', label: 'Support Tickets' }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.permissions.length === 0) {
      toast.error('Please select at least one permission')
      return
    }
    onSave(formData)
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permission]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permission)
      }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Add New Role
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
              {/* Role Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>


            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permissions * (Select at least one)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-4">
                {availablePermissions.map((permission) => (
                  <label key={permission.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission.value)}
                      onChange={(e) => handlePermissionChange(permission.value, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {permission.label}
                    </span>
                  </label>
                ))}
              </div>
              {formData.permissions.length === 0 && (
                <p className="mt-1 text-sm text-red-600">Please select at least one permission</p>
              )}
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
                disabled={loading || formData.permissions.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Role'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


