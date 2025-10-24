"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { apiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import CountrySelect from '@/components/ui/country-select'
import LanguageSelect from '@/components/ui/language-select'
import { X, Camera, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AccountForm() {
  const { user, refreshUser } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [timezone, setTimezone] = useState('')
  const [language, setLanguage] = useState('')
  const [birthday, setBirthday] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)


  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
      setAvatar(user.avatar || null)
      loadUserMeta()
    }
  }, [user])


  const loadUserMeta = async () => {
    try {
      const response = await apiService.getUserMeta()
      const userMeta = (response.data as any)?.userMeta
      if (userMeta) {
        setPhone(userMeta.phone || '')
        setLocation(userMeta.location || '')
        setCity(userMeta.city || '')
        setCountry(userMeta.country || '')
        setTimezone(userMeta.timezone || '')
        setLanguage(userMeta.language || '')
        setBirthday(userMeta.birthday || '')
      }
    } catch (err) {
      console.error('Failed to load user meta:', err)
    }
  }

  const handlePickImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setAvatar(result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    
    // Validate password fields if any password field is filled
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        toast.error('Current password is required to change password')
        return
      }
      if (!newPassword) {
        toast.error('New password is required')
        return
      }
      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match')
        return
      }
      if (newPassword.length < 6) {
        toast.error('New password must be at least 6 characters long')
        return
      }
    }
    
    try {
      setSaving(true)
      
      // Update basic user info
      const updateData: any = {
        firstName,
        lastName,
        avatar,
      }
      
      // Only include password fields if they're being changed
      if (currentPassword && newPassword) {
        updateData.currentPassword = currentPassword
        updateData.newPassword = newPassword
        console.log('Password update data:', { hasCurrentPassword: !!currentPassword, hasNewPassword: !!newPassword })
      }
      
      console.log('Sending update data:', updateData)
      const userResponse = await apiService.updateUser(user.id, updateData)
      
      // Update user meta (phone, location, city, country, timezone, language)
      const metaData = {
        phone: phone.trim(),
        location: location.trim(),
        city: city.trim(),
        country: country.trim(),
        timezone: timezone.trim(),
        language: language.trim(),
        birthday: birthday.trim()
      }
      console.log('Sending meta data:', metaData)
      const metaResponse = await apiService.updateUserMeta(metaData)
      await refreshUser()
      
      // Clear password fields after successful update
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      toast.success('Profile updated successfully')
    } catch (err: any) {
      console.error('AccountForm: Update failed', err)
      const message = err?.message || 'Failed to update'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header with close button */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Details</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* Photo Section */}
        <div className="mb-8">
          <div className="flex items-center gap-6">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Avatar
              </label>
            </div>
            <div className="flex-1">
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={handlePickImage}
                  className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-4 border-green-500 flex items-center justify-center hover:border-green-600 transition-colors cursor-pointer"
                >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
                    <div className="w-full h-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar(null)}
                    className="absolute -top-0 -right-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
          )}
        </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Name Row */}
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
            </div>
            <div className="flex-1">
              <input 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                value={`${firstName} ${lastName}`.trim()} 
                placeholder="Enter your full name"
                readOnly
              />
            </div>
          </div>

          {/* Phone Row */}
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone number
              </label>
            </div>
            <div className="flex-1">
              <input 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>
          </div>

          {/* Email Row */}
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
            </div>
            <div className="flex-1">
              <input 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                value={user?.email || ''} 
                placeholder="Email address"
                readOnly
              />
            </div>
          </div>

          {/* Address Row */}
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Address
              </label>
            </div>
            <div className="flex-1">
              <input 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                value={location} 
                onChange={e => setLocation(e.target.value)}
                placeholder="Enter your address"
              />
            </div>
          </div>

          {/* Country Row */}
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Country
              </label>
            </div>
            <div className="flex-1">
              <CountrySelect
                value={country}
                onChange={setCountry}
                placeholder="Select country"
              />
            </div>
          </div>

          {/* City Row */}
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                City
              </label>
        </div>
            <div className="flex-1">
              <input 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="City"
              />
        </div>
        </div>

          {/* Timezone Row */}
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Timezone
              </label>
        </div>
            <div className="flex-1">
              <select 
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                value={timezone} 
                onChange={e => setTimezone(e.target.value)}
              >
                <option value="">Select timezone...</option>
                <option value="UTC-12:00">UTC-12:00 (Baker Island)</option>
                <option value="UTC-11:00">UTC-11:00 (American Samoa)</option>
                <option value="UTC-10:00">UTC-10:00 (Hawaii)</option>
                <option value="UTC-09:00">UTC-09:00 (Alaska)</option>
                <option value="UTC-08:00">UTC-08:00 (Pacific Time)</option>
                <option value="UTC-07:00">UTC-07:00 (Mountain Time)</option>
                <option value="UTC-06:00">UTC-06:00 (Central Time)</option>
                <option value="UTC-05:00">UTC-05:00 (Eastern Time)</option>
                <option value="UTC-04:00">UTC-04:00 (Atlantic Time)</option>
                <option value="UTC-03:00">UTC-03:00 (Brazil)</option>
                <option value="UTC-02:00">UTC-02:00 (Mid-Atlantic)</option>
                <option value="UTC-01:00">UTC-01:00 (Azores)</option>
                <option value="UTC+00:00">UTC+00:00 (GMT/London)</option>
                <option value="UTC+01:00">UTC+01:00 (Central Europe)</option>
                <option value="UTC+02:00">UTC+02:00 (Eastern Europe)</option>
                <option value="UTC+03:00">UTC+03:00 (Moscow)</option>
                <option value="UTC+04:00">UTC+04:00 (Gulf)</option>
                <option value="UTC+05:00">UTC+05:00 (Pakistan)</option>
                <option value="UTC+05:30">UTC+05:30 (India)</option>
                <option value="UTC+06:00">UTC+06:00 (Bangladesh)</option>
                <option value="UTC+07:00">UTC+07:00 (Thailand)</option>
                <option value="UTC+08:00">UTC+08:00 (China)</option>
                <option value="UTC+09:00">UTC+09:00 (Japan)</option>
                <option value="UTC+10:00">UTC+10:00 (Australia)</option>
                <option value="UTC+11:00">UTC+11:00 (Solomon Islands)</option>
                <option value="UTC+12:00">UTC+12:00 (New Zealand)</option>
          </select>
        </div>
          </div>

                 {/* Language Row */}
                 <div className="flex items-center">
                   <div className="w-32 flex-shrink-0">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                       Language
                     </label>
                   </div>
                   <div className="flex-1">
                     <LanguageSelect
                       value={language}
                       onChange={setLanguage}
                       placeholder="Select language"
                     />
                   </div>
                 </div>

                 {/* Birthday Row */}
                 <div className="flex items-center">
                   <div className="w-32 flex-shrink-0">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                       Birthday
                     </label>
                   </div>
                   <div className="flex-1">
                     <input
                       type="date"
                       className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       value={birthday}
                       onChange={e => setBirthday(e.target.value)}
                     />
                   </div>
                 </div>
        </div>

        {/* Password Section - Optional */}
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password (Optional)</h3>
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="w-32 flex-shrink-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Password
                </label>
              </div>
              <div className="flex-1">
                <input 
                  type="password" 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-32 flex-shrink-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
              </div>
              <div className="flex-1">
                <input 
                  type="password" 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-32 flex-shrink-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
          </div>
              <div className="flex-1">
                <input 
                  type="password" 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
          </div>
          </div>
        </div>
      </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button 
            disabled={saving} 
            type="submit" 
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
    </div>
  )
}


