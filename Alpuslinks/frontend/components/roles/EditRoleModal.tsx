"use client"
import { useState } from 'react'
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

interface EditRoleModalProps {
  role: Role
  onSave: (roleData: any) => void
  onCancel: () => void
}

export function EditRoleModal({ role, onSave, onCancel }: EditRoleModalProps) {
  const [formData, setFormData] = useState({
    name: role.name,
    permissions: role.permissions,
    color: role.color,
    isActive: role.isActive
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
              Edit Role
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
            {/* Role Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>


            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="flex items-center space-x-3">
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
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Permissions
              </label>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-4">
                {availablePermissions.map((permission) => (
                  <label key={permission.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission.value)}
                      onChange={(e) => handlePermissionChange(permission.value, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {permission.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active Role
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
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
                {loading ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
