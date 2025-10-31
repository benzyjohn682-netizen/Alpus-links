"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { apiService } from '@/lib/api'
import toast from 'react-hot-toast'

interface LinkInsertionData {
  title: string
  completeUrl: string
  requirements?: string
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  anchorPairs: Array<{ text: string; link: string }>
}

export default function PublisherOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = (params?.id as string) || ''
  
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [linkInsertionData, setLinkInsertionData] = useState<LinkInsertionData | null>(null)

  // Load order and post data
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        toast.error('Order ID is missing')
        router.push('/publisher/orders')
        return
      }
      
      try {
        setLoading(true)
        
        // Fetch order details
        const orderResponse = await apiService.getOrder(orderId)
        
        // Handle different response structures
        let orderData = null
        if ((orderResponse.data as any)?.data?.order) {
          orderData = (orderResponse.data as any).data.order
        } else if ((orderResponse.data as any)?.order) {
          orderData = (orderResponse.data as any).order
        } else if ((orderResponse.data as any)?.success && (orderResponse.data as any)?.data) {
          orderData = (orderResponse.data as any).data.order || (orderResponse.data as any).data
        }
        
        console.log('Order response:', orderResponse)
        console.log('Order data:', orderData)
        
        if (!orderData) {
          console.error('Order not found. Response:', orderResponse)
          toast.error('Order not found')
          router.push('/publisher/orders')
          return
        }
        
        setOrder(orderData)
        
        // For link insertion orders, use the post data from order.postId (populated by backend)
        if (orderData.type === 'linkInsertion') {
          // Backend should populate order.postId with the post data
          let post = null
          
          // Check if postId is already populated with post data (backend should do this)
          // If postId is an object with title or _id, it's populated with post data
          if (orderData.postId && typeof orderData.postId === 'object' && 
              (orderData.postId.title !== undefined || orderData.postId._id !== undefined)) {
            // postId is populated with post data
            post = orderData.postId
            console.log('Using post data from populated order.postId:', post)
          } else {
            // postId is not populated, need to extract postId and fetch it
            let postId: string | null = null
            
            // Try to extract postId from order.postId
            if (orderData.postId) {
              if (orderData.postId._id) {
                postId = typeof orderData.postId._id === 'string' 
                  ? orderData.postId._id 
                  : orderData.postId._id.toString()
              } else if (typeof orderData.postId === 'string') {
                postId = orderData.postId
              }
            } 
            // Check linkInsertionId as fallback
            else if (orderData.linkInsertionId) {
              if (typeof orderData.linkInsertionId === 'object') {
                if (orderData.linkInsertionId._id) {
                  postId = typeof orderData.linkInsertionId._id === 'string'
                    ? orderData.linkInsertionId._id
                    : orderData.linkInsertionId._id.toString()
                } else if (orderData.linkInsertionId.toString) {
                  postId = orderData.linkInsertionId.toString()
                }
              } else if (typeof orderData.linkInsertionId === 'string') {
                postId = orderData.linkInsertionId
              }
            }
            
            console.log('PostId extracted for fetching:', postId)
            console.log('Order postId:', orderData.postId)
            console.log('Order linkInsertionId:', orderData.linkInsertionId)
            
            if (postId) {
              try {
                const postResponse = await apiService.getPost(postId)
                
                // Handle different response structures
                if ((postResponse.data as any)?.post) {
                  post = (postResponse.data as any).post
                } else if ((postResponse.data as any)?.success && (postResponse.data as any)?.data) {
                  post = (postResponse.data as any).data.post || (postResponse.data as any).data
                } else if ((postResponse.data as any)) {
                  post = (postResponse.data as any).post || (postResponse.data as any)
                }
                
                console.log('Post fetched from API:', post)
              } catch (error: any) {
                console.error('Error fetching post:', error)
                console.error('PostId attempted:', postId)
                console.error('Order data:', orderData)
                toast.error('Failed to load post details: ' + (error?.message || 'Unknown error'))
                return // Exit early if post fetch fails
              }
            } else {
              console.error('No post ID found for link insertion order:', orderData)
              toast.error('Unable to find associated post for this order')
              return // Exit early if no postId found
            }
          }
          
          // Set link insertion data from post (either from populated postId or fetched)
          if (post && post.title !== undefined) {
            console.log('Setting link insertion data from post:', post)
            setLinkInsertionData({
              title: post.title || '',
              completeUrl: post.completeUrl || '',
              requirements: post.content || '',
              metaTitle: post.metaTitle || '',
              metaDescription: post.metaDescription || '',
              keywords: post.keywords || '',
              anchorPairs: post.anchorPairs || []
            })
          } else {
            console.error('Post data is invalid:', post)
            console.error('Order data:', orderData)
            toast.error('Failed to load post details: Post data is invalid')
          }
        }
      } catch (error: any) {
        console.error('Load error:', error)
        toast.error(error?.message || 'Failed to load order')
        router.push('/publisher/orders')
      } finally {
        setLoading(false)
      }
    }
    
    loadOrder()
  }, [orderId, router])

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["publisher"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading order details...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Only show details for link insertion orders
  if (!order) {
    return (
      <ProtectedRoute allowedRoles={["publisher"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center space-x-3 mb-8">
              <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Detail</h1>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6">
              <p className="text-gray-600 dark:text-gray-400">Order not found.</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (order.type !== 'linkInsertion') {
    return (
      <ProtectedRoute allowedRoles={["publisher"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center space-x-3 mb-8">
              <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Detail</h1>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6">
              <p className="text-gray-600 dark:text-gray-400">Order details not available for this order type: {order.type}.</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!linkInsertionData) {
    return (
      <ProtectedRoute allowedRoles={["publisher"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center space-x-3 mb-8">
              <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Detail</h1>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6">
              <p className="text-gray-600 dark:text-gray-400">Loading link insertion details...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["publisher"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3 mb-8">
            <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Detail</h1>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={linkInsertionData.title || ''}
                readOnly
                disabled
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed opacity-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Post URL</label>
              <input
                type="text"
                value={linkInsertionData.completeUrl || ''}
                readOnly
                disabled
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed opacity-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Anchor Text</label>
                <input
                  type="text"
                  value={linkInsertionData.anchorPairs[0]?.text || ''}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed opacity-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Anchor URL</label>
                <input
                  type="text"
                  value={linkInsertionData.anchorPairs[0]?.link || ''}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed opacity-100 break-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Requirements (Optional)</label>
              <textarea
                value={linkInsertionData.requirements || ''}
                readOnly
                disabled
                rows={4}
                placeholder="Describe any specific requirements, guidelines, or preferences for the link insertion..."
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed opacity-100 resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
