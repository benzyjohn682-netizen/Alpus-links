"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { apiService } from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Edit, Trash2, Key, Mail, Phone, Calendar, Shield, Activity, Globe, User, Clock, X, ClipboardList, FileText } from 'lucide-react'

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
  updatedAt?: string
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
  meta?: {
    phone?: string
    website?: string
    bio?: string
    location?: string
    city?: string
    country?: string
    timezone?: string
    language?: string
    twitter?: string
    linkedin?: string
    github?: string
  }
}

interface UserActivity {
  _id: string
  type: string
  description: string
  timestamp: string
  ipAddress?: string
  userAgent?: string
}

interface Order {
  _id: string
  advertiserId: {
    _id: string
    firstName: string
    lastName: string
    email: string
    company?: string
  }
  publisherId: {
    _id: string
    firstName: string
    lastName: string
    email: string
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
  linkInsertionId?: {
    _id: string
    anchorText: string
    anchorUrl: string
  }
  type: 'guestPost' | 'linkInsertion' | 'writingGuestPost'
  status: 'requested' | 'inProgress' | 'advertiserApproval' | 'completed' | 'rejected'
  price: number
  notes?: string
  createdAt: string
  updatedAt: string
  rejectionReason?: string
}

interface Post {
  _id: string
  title: string
  slug: string
  completeUrl: string
  description: string
  status: 'draft' | 'pending' | 'inProgress' | 'approved' | 'rejected'
  postType: 'regular' | 'link-insertion' | 'writing-gp'
  createdAt: string
  updatedAt: string
  anchorPairs?: Array<{
    text: string
    link: string
  }>
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [postsLoading, setPostsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [passwordChanging, setPasswordChanging] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    city: '',
    country: '',
    timezone: '',
    language: '',
    birthday: '',
    status: '',
    emailVerified: false,
    lastLogin: '',
    createdAt: '',
    updatedAt: ''
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
      loadOrders()
      loadPosts()
    }
  }, [userId])

  const loadUser = async () => {
    try {
      setLoading(true)
      const response = await apiService.getUserById(userId)
      const userData = response.data as User
      
      if (userData) {
        setUser(userData)
        
        // Load user meta data from user object
        let userMeta: any = {}
        if (userData.meta) {
          userMeta = userData.meta
          console.log('Found meta data in user object:', userMeta)
          console.log('Specific fields - location:', userMeta.location, 'city:', userMeta.city, 'country:', userMeta.country, 'timezone:', userMeta.timezone)
        } else {
          console.log('No meta data found in user object')
        }
        
        setEditForm({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userMeta.phone || userData.phone || '',
          location: userMeta.location || userData.location || '',
          city: userMeta.city || '',
          country: userMeta.country || '',
          timezone: userMeta.timezone || '',
          language: userMeta.language || '',
          birthday: userMeta.birthday || '',
          status: userData.status || 'active',
          emailVerified: userData.emailVerified || false,
          lastLogin: userData.lastLogin || '',
          createdAt: userData.createdAt || '',
          updatedAt: userData.updatedAt || ''
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

  const loadOrders = async () => {
    try {
      setOrdersLoading(true)
      const response = await apiService.getOrdersByUserId(userId) as any
      if (response.data?.success) {
        setOrders(response.data.data.orders || [])
      }
    } catch (err: any) {
      console.error('Failed to load orders:', err)
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  const loadPosts = async () => {
    try {
      setPostsLoading(true)
      const response = await apiService.getPostsByUserId(userId) as any
      if (response.data?.success) {
        setPosts(response.data.data.posts || [])
      }
    } catch (err: any) {
      console.error('Failed to load posts:', err)
      setPosts([])
    } finally {
      setPostsLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!user) return

    try {
      setSaving(true)
      
      // Update basic user info
      const basicUserData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        status: editForm.status,
        phone: editForm.phone,
        location: editForm.location
      }
      await apiService.updateUser(user._id, basicUserData)
      
      // Update user meta data
      const metaData = {
        phone: editForm.phone,
        location: editForm.location,
        city: editForm.city,
        country: editForm.country,
        timezone: editForm.timezone,
        language: editForm.language,
        birthday: editForm.birthday
      }
      await apiService.updateUserMetaById(user._id, metaData)
      
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

  const getBadgeStatusColor = (status: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'inProgress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'advertiserApproval':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guestPost':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'linkInsertion':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'writingGuestPost':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'regular':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'link-insertion':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'writing-gp':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getPostTypeLabel = (postType: string) => {
    switch (postType) {
      case 'regular': return 'Guest Post'
      case 'link-insertion': return 'Link Insertion'
      case 'writing-gp': return 'Writing + GP'
      default: return postType
    }
  }

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'guestPost': return 'Guest Post'
      case 'linkInsertion': return 'Link Insertion'
      case 'writingGuestPost': return 'Writing + GP'
      default: return type
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["super admin", "admin"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
          <div className="w-full px-4">
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
          <div className="w-full px-4">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="w-full px-4">
          <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/alpus-admin/users/all')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Edit User: {user.firstName} {user.lastName}
                  </h2>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePasswordClick}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
            </div>
          </div>

            <form onSubmit={handleUpdate} className="p-6">
              {/* Form Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* First Name Row */}
                <div className="flex items-center">
                  <div className="w-32 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name
                    </label>
                </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter first name"
                    />
                  </div>
                </div>

                {/* Last Name Row */}
                <div className="flex items-center">
                  <div className="w-32 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name
                    </label>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter last name"
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
                    <div className="flex items-center space-x-2">
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter email address"
                      />
                      {user?.emailVerified && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
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
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
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
                      value={editForm.location}
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter address"
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
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter city"
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
                    <input
                      type="text"
                      value={editForm.country}
                      onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter country"
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
                    <input
                      type="text"
                      value={editForm.timezone}
                      onChange={(e) => setEditForm({...editForm, timezone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="UTC+0"
                    />
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
           <select
             value={editForm.language}
             onChange={(e) => setEditForm({...editForm, language: e.target.value})}
             className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
           >
             <option value="">Select language...</option>
             <option value="English">English</option>
             <option value="Spanish">Spanish</option>
             <option value="French">French</option>
             <option value="German">German</option>
             <option value="Italian">Italian</option>
             <option value="Portuguese">Portuguese</option>
             <option value="Russian">Russian</option>
             <option value="Japanese">Japanese</option>
             <option value="Korean">Korean</option>
             <option value="Chinese">Chinese</option>
             <option value="Arabic">Arabic</option>
             <option value="Hindi">Hindi</option>
             <option value="Dutch">Dutch</option>
             <option value="Swedish">Swedish</option>
             <option value="Norwegian">Norwegian</option>
             <option value="Danish">Danish</option>
             <option value="Finnish">Finnish</option>
             <option value="Polish">Polish</option>
             <option value="Turkish">Turkish</option>
             <option value="Thai">Thai</option>
             <option value="Vietnamese">Vietnamese</option>
             <option value="Indonesian">Indonesian</option>
             <option value="Malay">Malay</option>
             <option value="Filipino">Filipino</option>
             <option value="Hebrew">Hebrew</option>
             <option value="Ukrainian">Ukrainian</option>
             <option value="Czech">Czech</option>
             <option value="Hungarian">Hungarian</option>
             <option value="Romanian">Romanian</option>
             <option value="Bulgarian">Bulgarian</option>
             <option value="Croatian">Croatian</option>
             <option value="Slovak">Slovak</option>
             <option value="Slovenian">Slovenian</option>
             <option value="Estonian">Estonian</option>
             <option value="Latvian">Latvian</option>
             <option value="Lithuanian">Lithuanian</option>
             <option value="Greek">Greek</option>
             <option value="Icelandic">Icelandic</option>
             <option value="Irish">Irish</option>
             <option value="Welsh">Welsh</option>
             <option value="Maltese">Maltese</option>
             <option value="Catalan">Catalan</option>
             <option value="Basque">Basque</option>
             <option value="Galician">Galician</option>
             <option value="Afrikaans">Afrikaans</option>
             <option value="Swahili">Swahili</option>
             <option value="Amharic">Amharic</option>
             <option value="Bengali">Bengali</option>
             <option value="Gujarati">Gujarati</option>
             <option value="Kannada">Kannada</option>
             <option value="Malayalam">Malayalam</option>
             <option value="Marathi">Marathi</option>
             <option value="Nepali">Nepali</option>
             <option value="Punjabi">Punjabi</option>
             <option value="Sinhala">Sinhala</option>
             <option value="Tamil">Tamil</option>
             <option value="Telugu">Telugu</option>
             <option value="Urdu">Urdu</option>
           </select>
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
             value={editForm.birthday}
             onChange={(e) => setEditForm({...editForm, birthday: e.target.value})}
             className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
           />
         </div>
       </div>

                {/* Status Row */}
                <div className="flex items-center">
                  <div className="w-32 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </label>
                  </div>
                  <div className="flex-1">
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                {/* Email Verified Row */}
                <div className="flex items-center">
                  <div className="w-32 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Verified
                    </label>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${editForm.emailVerified ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="text-gray-900 dark:text-white">
                        {editForm.emailVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Last Login Row */}
                <div className="flex items-center">
                  <div className="w-32 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Login
                    </label>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editForm.lastLogin ? new Date(editForm.lastLogin).toLocaleString() : 'Never'}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                      readOnly
                    />
                  </div>
                    </div>

                {/* Created At Row */}
                <div className="flex items-center">
                  <div className="w-32 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Created At
                    </label>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editForm.createdAt ? new Date(editForm.createdAt).toLocaleString() : ''}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                      readOnly
                    />
              </div>
            </div>

                {/* Updated At Row */}
                <div className="flex items-center">
                  <div className="w-32 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Updated At
                    </label>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editForm.updatedAt ? new Date(editForm.updatedAt).toLocaleString() : ''}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
            </form>

            {/* Orders Table */}
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8 px-6 pb-6">
              <div className="flex items-center space-x-2 mb-4">
                <ClipboardList className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Orders ({orders.length})
                </h3>
              </div>
              
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No orders found for this user.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {user?.role?.name === 'advertiser' ? 'Publisher' : 'Advertiser'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Website
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                            {order._id.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(order.type)}`}>
                              {getOrderTypeLabel(order.type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {user?.role?.name === 'advertiser' 
                              ? `${order.publisherId.firstName} ${order.publisherId.lastName}`
                              : `${order.advertiserId.firstName} ${order.advertiserId.lastName}`}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {order.websiteId.domain}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeStatusColor(order.status)}`}>
                              {order.status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            ${order.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(order.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Posts Table */}
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8 px-6 pb-6">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Posts ({posts.length})
                </h3>
              </div>
              
              {postsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No posts found for this user.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          URL
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {posts.map((post) => (
                        <tr key={post._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {post.title || 'Untitled'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(post.postType)}`}>
                              {getPostTypeLabel(post.postType)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            <a 
                              href={post.completeUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate max-w-xs block"
                            >
                              {post.completeUrl}
                            </a>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeStatusColor(post.status)}`}>
                              {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(post.createdAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(post.updatedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
