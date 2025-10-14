"use client"

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserLoginChart } from '@/components/charts/UserLoginChart'
import { apiService } from '@/lib/api'
import { Users, TrendingUp, UserPlus, Activity } from 'lucide-react'

interface LoginTrendData {
  date: string
  advertisers: number
  publishers: number
  total: number
}

interface LoginTrendsResponse {
  data: LoginTrendData[]
  period: string
  totalAdvertisers: number
  totalPublishers: number
  totalUsers: number
}

export default function AdminDashboardPage() {
  const [loginData, setLoginData] = useState<LoginTrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalAdvertisers: 0,
    totalPublishers: 0,
    totalUsers: 0
  })

  useEffect(() => {
    loadLoginTrends('30d')
  }, [])

  const loadLoginTrends = async (period: string = '30d') => {
    try {
      setLoading(true)
      const response = await apiService.getUserLoginTrends(period)
      const data = response.data as LoginTrendsResponse
      setLoginData(data.data)
      setSummary({
        totalAdvertisers: data.totalAdvertisers,
        totalPublishers: data.totalPublishers,
        totalUsers: data.totalUsers
      })
    } catch (err) {
      console.error('Failed to load login trends:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeRangeChange = (timeRange: '7d' | '30d' | '90d') => {
    loadLoginTrends(timeRange)
  }

  return (
    <ProtectedRoute allowedRoles={["super admin", "admin"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
        <div className="max-w-8xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor user activity and system performance</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Advertisers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalAdvertisers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Publishers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalPublishers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Login Chart */}
          <div className="mb-8">
            <UserLoginChart 
              data={loginData} 
              loading={loading} 
              onTimeRangeChange={handleTimeRangeChange}
            />
          </div>

          {/* Additional Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center mb-4">
                <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Logins today</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {loginData.length > 0 ? loginData[loginData.length - 1]?.total || 0 : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Advertiser logins</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {loginData.length > 0 ? loginData[loginData.length - 1]?.advertisers || 0 : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Publisher logins</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {loginData.length > 0 ? loginData[loginData.length - 1]?.publishers || 0 : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <a 
                  href="/alpus-admin/users/all" 
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
                >
                  Manage Users
                </a>
                <a 
                  href="/alpus-admin/websites" 
                  className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
                >
                  Manage Websites
                </a>
                <a 
                  href="/alpus-admin/roles" 
                  className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
                >
                  Manage Roles
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}


