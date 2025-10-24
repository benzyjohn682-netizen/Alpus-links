"use client"

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { apiService } from '@/lib/api'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AddUserPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    phone: '',
    location: ''
  })
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      const response = await apiService.getRoles()
      setRoles((response.data as any)?.roles || [])
    } catch (err) {
      console.error('Failed to load roles:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      await apiService.createUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        location: formData.location
      })
      
      toast.success('User created successfully')
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        phone: '',
        location: ''
      })
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["super admin", "admin"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-4xl w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            {/* Header with close button */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New User</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Form Fields */}
              <div className="space-y-6">
                {/* First Name Row */}
                <div className="flex items-center">
                  <div className="w-32 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name *
                    </label>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter first name"
                    />
                  </div>
                </div>

                {/* Last Name Row */}
                <div className="flex items-center">
                  <div className="w-32 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name *
                    </label>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                {/* Email Row */}
                <div className="flex items-center">
                  <div className="w-32 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email *
                    </label>
                  </div>
                  <div className="flex-1">
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                {/* Password Row */}
                <div className="flex items-center">
                  <div className="w-32 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password *
                    </label>
                  </div>
                  <div className="flex-1">
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter password"
                    />
                  </div>
                </div>

                {/* Confirm Password Row */}
                <div className="flex items-center">
                  <div className="w-32 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirm Password *
                    </label>
                  </div>
                  <div className="flex-1">
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Confirm password"
                    />
                  </div>
                </div>

                {/* Role Row */}
                <div className="flex items-center">
                  <div className="w-32 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role *
                    </label>
                  </div>
                  <div className="flex-1">
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select a role</option>
                      {roles.map((role) => (
                        <option key={role._id} value={role._id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Phone Row */}
                <div className="flex items-center">
                  <div className="w-32 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </label>
                  </div>
                  <div className="flex-1">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                {/* Location Row */}
                <div className="flex items-center">
                  <div className="w-32 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Location
                    </label>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter location"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
