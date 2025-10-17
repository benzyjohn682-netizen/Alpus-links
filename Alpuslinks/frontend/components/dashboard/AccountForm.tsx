"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { apiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import toast from 'react-hot-toast'

export default function AccountForm() {
  const { user, refreshUser } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [country, setCountry] = useState('')
  const [language, setLanguage] = useState('')
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
        setCountry(userMeta.country || '')
        setLanguage(userMeta.language || '')
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
      
      // Update user meta (phone, location, country, language)
      const metaData = {
        phone: phone.trim(),
        location: location.trim(),
        country: country.trim(),
        language: language.trim()
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
    <form onSubmit={handleSubmit} className="max-w-2xl w-full mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <DefaultAvatar className="w-full h-full" alt="Default Avatar" name={`${firstName} ${lastName}`.trim()} />
          )}
        </div>
        <div>
          <button type="button" onClick={handlePickImage} className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-500">Upload Avatar</button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">First Name</label>
          <input className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Last Name</label>
          <input className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Phone</label>
          <input className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Location</label>
          <input className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Country</label>
          <select className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" value={country} onChange={e => setCountry(e.target.value)}>
            <option value="">Select Country</option>
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
            <option value="Spain">Spain</option>
            <option value="Italy">Italy</option>
            <option value="Netherlands">Netherlands</option>
            <option value="Australia">Australia</option>
            <option value="Japan">Japan</option>
            <option value="South Korea">South Korea</option>
            <option value="China">China</option>
            <option value="India">India</option>
            <option value="Brazil">Brazil</option>
            <option value="Mexico">Mexico</option>
            <option value="Argentina">Argentina</option>
            <option value="South Africa">South Africa</option>
            <option value="Nigeria">Nigeria</option>
            <option value="Egypt">Egypt</option>
            <option value="Russia">Russia</option>
            <option value="Turkey">Turkey</option>
            <option value="Saudi Arabia">Saudi Arabia</option>
            <option value="United Arab Emirates">United Arab Emirates</option>
            <option value="Israel">Israel</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Language</label>
          <select className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="">Select Language</option>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Italian">Italian</option>
            <option value="Portuguese">Portuguese</option>
            <option value="Russian">Russian</option>
            <option value="Chinese">Chinese</option>
            <option value="Japanese">Japanese</option>
            <option value="Korean">Korean</option>
            <option value="Arabic">Arabic</option>
            <option value="Hindi">Hindi</option>
            <option value="Dutch">Dutch</option>
            <option value="Swedish">Swedish</option>
            <option value="Norwegian">Norwegian</option>
            <option value="Danish">Danish</option>
            <option value="Finnish">Finnish</option>
            <option value="Polish">Polish</option>
            <option value="Czech">Czech</option>
            <option value="Hungarian">Hungarian</option>
            <option value="Romanian">Romanian</option>
            <option value="Greek">Greek</option>
            <option value="Turkish">Turkish</option>
            <option value="Hebrew">Hebrew</option>
            <option value="Thai">Thai</option>
            <option value="Vietnamese">Vietnamese</option>
            <option value="Indonesian">Indonesian</option>
            <option value="Malay">Malay</option>
            <option value="Tagalog">Tagalog</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Current Password</label>
            <input type="password" className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">New Password</label>
            <input type="password" className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Confirm New Password</label>
            <input type="password" className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button disabled={saving} type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}


