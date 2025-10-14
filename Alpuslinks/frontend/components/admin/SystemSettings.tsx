"use client"

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Settings, AlertCircle } from 'lucide-react'
import { apiService } from '@/lib/api'
import toast from 'react-hot-toast'

interface SystemConfig {
  [key: string]: {
    value: any
    description: string
    category: string
  }
}

export function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSystemConfig()
  }, [])

  const fetchSystemConfig = async () => {
    try {
      const response = await apiService.getSystemConfig()
      if (response.data) {
        setConfig((response.data as any).config || {})
      } else {
        // If no config exists, initialize with defaults
        setConfig({})
      }
    } catch (error) {
      console.error('Error fetching system config:', error)
      toast.error('Failed to fetch system configuration')
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = async (key: string, value: any, description: string) => {
    setSaving(true)
    try {
      const response = await apiService.updateSystemConfig({
        key,
        value,
        description,
        category: 'security'
      })

      if (response.data) {
        setConfig(prev => ({
          ...prev,
          [key]: {
            value,
            description,
            category: 'security'
          }
        }))
        toast.success('System configuration updated successfully')
      }
    } catch (error) {
      console.error('Error updating config:', error)
      toast.error('Failed to update configuration')
    } finally {
      setSaving(false)
    }
  }

  const handle2FAToggle = async (enabled: boolean) => {
    await updateConfig(
      '2fa_enabled_for_login',
      enabled,
      enabled ? '2FA is required for user login' : '2FA is not required for user login'
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
      </div>

      <div className="grid gap-6">
        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Security Settings</span>
            </CardTitle>
            <CardDescription>
              Configure security features for your application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 2FA Settings */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Two-Factor Authentication for Login
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {config['2fa_enabled_for_login']?.value 
                    ? 'Users must complete 2FA verification when logging in'
                    : 'Users can log in without 2FA verification'
                  }
                </p>
                <div className="flex items-center space-x-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Note: 2FA is always required during user registration regardless of this setting
                  </span>
                </div>
              </div>
              <Switch
                checked={config['2fa_enabled_for_login']?.value || false}
                onCheckedChange={handle2FAToggle}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Current Configuration Display */}
        <Card>
          <CardHeader>
            <CardTitle>Current Configuration</CardTitle>
            <CardDescription>
              View current system settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="font-medium">2FA for Login:</span>
                <span className={`px-2 py-1 rounded-full text-sm ${
                  config['2fa_enabled_for_login']?.value 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {config['2fa_enabled_for_login']?.value ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
