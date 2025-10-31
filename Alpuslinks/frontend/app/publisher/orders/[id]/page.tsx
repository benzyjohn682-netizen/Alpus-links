"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Eye, Code } from 'lucide-react'
import { apiService } from '@/lib/api'
import toast from 'react-hot-toast'
import RichTextEditor from '@/components/editor/RichTextEditor'
import CodeEditor from '@/components/editor/CodeEditor'

interface LinkInsertionData {
  title: string
  completeUrl: string
  requirements?: string
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  anchorPairs: Array<{ text: string; link: string }>
}

interface GuestPostData {
  title: string
  domain: string
  slug: string
  description: string
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  content: string
}

export default function PublisherOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = (params?.id as string) || ''
  
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [linkInsertionData, setLinkInsertionData] = useState<LinkInsertionData | null>(null)
  const [guestPostData, setGuestPostData] = useState<GuestPostData | null>(null)
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual')
  const [wordCount, setWordCount] = useState(0)

  // Calculate word count
  const updateWordCount = (text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0)
    setWordCount(words.length)
  }

  useEffect(() => {
    if (guestPostData?.content) {
      updateWordCount(guestPostData.content)
    }
  }, [guestPostData])

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
        
        // For all order types, fetch the post data
        if (orderData.postId) {
          let post = null
          
          // Check if postId is already populated with post data
          if (orderData.postId && typeof orderData.postId === 'object' && 
              (orderData.postId.title !== undefined || orderData.postId._id !== undefined)) {
            post = orderData.postId
          } else {
            // Extract postId and fetch it
            let postId: string | null = null
            
            if (orderData.postId._id) {
              postId = typeof orderData.postId._id === 'string' 
                ? orderData.postId._id 
                : orderData.postId._id.toString()
            } else if (typeof orderData.postId === 'string') {
              postId = orderData.postId
            }
            
            if (postId) {
              try {
                const postResponse = await apiService.getPost(postId)
                if ((postResponse.data as any)?.post) {
                  post = (postResponse.data as any).post
                } else if ((postResponse.data as any)?.success && (postResponse.data as any)?.data) {
                  post = (postResponse.data as any).data.post || (postResponse.data as any).data
                } else if ((postResponse.data as any)) {
                  post = (postResponse.data as any).post || (postResponse.data as any)
                }
              } catch (error: any) {
                console.error('Error fetching post:', error)
                toast.error('Failed to load post details: ' + (error?.message || 'Unknown error'))
              }
            }
          }
          
          if (post) {
            // Handle link insertion orders
            if (orderData.type === 'linkInsertion') {
              setLinkInsertionData({
                title: post.title || '',
                completeUrl: post.completeUrl || '',
                requirements: post.content || '',
                metaTitle: post.metaTitle || '',
                metaDescription: post.metaDescription || '',
                keywords: post.keywords || '',
                anchorPairs: post.anchorPairs || []
              })
            } 
            // Handle guest post orders
            else if (orderData.type === 'guestPost') {
              // Extract domain and slug from completeUrl
              let domain = post.domain || ''
              let slug = post.slug || ''
              
              if (post.completeUrl) {
                try {
                  const urlObj = new URL(post.completeUrl.startsWith('http') ? post.completeUrl : `https://${post.completeUrl}`)
                  domain = `${urlObj.protocol}//${urlObj.hostname}`
                  slug = urlObj.pathname.replace(/^\//, '') || 'untitled'
                } catch (e) {
                  const parts = post.completeUrl.split('/')
                  if (parts.length >= 3) {
                    domain = `${parts[0]}//${parts[2]}`
                    slug = parts.slice(3).join('/') || 'untitled'
                  } else {
                    slug = post.completeUrl || 'untitled'
                    domain = ''
                  }
                }
              }
              
              setGuestPostData({
                title: post.title || '',
                domain: domain,
                slug: slug,
                description: post.description || '',
                metaTitle: post.metaTitle || '',
                metaDescription: post.metaDescription || '',
                keywords: post.keywords || '',
                content: post.content || ''
              })
            }
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

  // Show loading state if data is still being fetched
  if (order.type === 'linkInsertion' && !linkInsertionData) {
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

  if (order.type === 'guestPost' && !guestPostData) {
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
              <p className="text-gray-600 dark:text-gray-400">Loading guest post details...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const displayData = order?.type === 'guestPost' ? guestPostData : linkInsertionData

  return (
    <ProtectedRoute allowedRoles={["publisher"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={() => router.back()}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Order Detail
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {order?.type === 'guestPost' ? 'View guest post details' : 'View link insertion details'}
                </p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Content</span>
              </div>
              <div className="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">SEO</span>
              </div>
              <div className="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Publish</span>
              </div>
            </div>
          </div>

          {/* Guest Post Display */}
          {order?.type === 'guestPost' && guestPostData && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Main Content Editor */}
              <div className="xl:col-span-3">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/50 overflow-hidden hover:shadow-3xl transition-all duration-300">
                  <div className="p-8">
                    {/* Article Title */}
                    <div className="mb-8">
                      <label className="block text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                        Article Title *
                      </label>
                      <div className="relative group">
                        <input
                          type="text"
                          value={guestPostData.title || ''}
                          readOnly
                          disabled
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 text-lg font-semibold opacity-60 cursor-not-allowed"
                        />
                        <span className="absolute right-4 top-4 text-sm text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium">{(guestPostData.title || '').length}</span>
                      </div>
                    </div>

                    {/* Domain */}
                    <div className="mb-8">
                      <label className="block text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-4"></div>
                        Target Domain *
                      </label>
                      <div className="relative group">
                        <input
                          type="text"
                          value={guestPostData.domain || ''}
                          readOnly
                          disabled
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 text-lg font-mono opacity-60 cursor-not-allowed"
                        />
                        <span className="absolute right-4 top-4 text-sm text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium">{(guestPostData.domain || '').length}</span>
                      </div>
                    </div>

                    {/* URL Slug */}
                    <div className="mb-8">
                      <label className="block text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-4"></div>
                        URL Slug *
                      </label>
                      <div className="relative group">
                        <input
                          type="text"
                          value={guestPostData.slug || ''}
                          readOnly
                          disabled
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 text-lg font-mono opacity-60 cursor-not-allowed"
                        />
                        <span className="absolute right-4 top-4 text-sm text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium">{(guestPostData.slug || '').length}</span>
                      </div>
                      {guestPostData.domain && guestPostData.slug && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Complete URL Preview:</p>
                          <p className="text-lg font-mono text-gray-900 dark:text-white">
                            {guestPostData.domain}/{guestPostData.slug}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Description/Content Editor */}
                    <div className="mb-8">
                      <label className="block text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                        <div className="w-3 h-3 bg-cyan-500 rounded-full mr-4"></div>
                        Content *
                      </label>
                      <div className="border-2 border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300">
                        {/* Editor Mode Tabs */}
                        <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-lg">
                                <button
                                  onClick={() => setEditorMode('visual')}
                                  className={`flex items-center space-x-3 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
                                    editorMode === 'visual' 
                                      ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  <Eye className="w-5 h-5" />
                                  <span>Visual</span>
                                </button>
                                <button
                                  onClick={() => setEditorMode('html')}
                                  className={`flex items-center space-x-3 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
                                    editorMode === 'html' 
                                      ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  <Code className="w-5 h-5" />
                                  <span>HTML</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Content Area */}
                        <div className="relative">
                          {editorMode === 'visual' ? (
                            <RichTextEditor
                              value={guestPostData.content || ''}
                              onChange={() => {}}
                              placeholder="Content will appear here..."
                              height="450px"
                              readOnly={true}
                            />
                          ) : (
                            <CodeEditor
                              value={guestPostData.content || ''}
                              onChange={() => {}}
                              language="html"
                              height="450px"
                              placeholder="HTML content will appear here..."
                              readOnly={true}
                            />
                          )}
                        </div>
                        
                        {/* Word Count */}
                        <div className="mt-4 flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Word count: <span className="text-blue-600 dark:text-blue-400 font-semibold">{wordCount}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {wordCount < 300 ? 'Minimum 300 words recommended' : wordCount > 2000 ? 'Consider breaking into multiple posts' : 'Good length for SEO'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar with Meta Information */}
              <div className="xl:col-span-1">
                <div className="space-y-8">
                  {/* Meta-tags Section */}
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/50 overflow-hidden hover:shadow-3xl transition-all duration-300">
                    <div className="bg-blue-600 px-4 py-3">
                      <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold">M</span>
                        </div>
                        <span>Meta-tags</span>
                        <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center ml-auto">
                          <span className="text-xs text-white font-bold">i</span>
                        </div>
                      </h2>
                    </div>
                    
                    <div className="p-4 space-y-6">
                      <div>
                        <label className="block text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                          <div className="w-3 h-3 bg-orange-500 rounded-full mr-4"></div>
                          Meta Title *
                        </label>
                        <div className="relative group">
                          <input
                            type="text"
                            value={guestPostData.metaTitle || ''}
                            readOnly
                            disabled
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 text-lg font-semibold opacity-60 cursor-not-allowed"
                          />
                          <span className="absolute right-4 top-4 text-sm text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium">{(guestPostData.metaTitle || '').length}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                          <div className="w-3 h-3 bg-teal-500 rounded-full mr-4"></div>
                          Meta Description *
                        </label>
                        <div className="relative group">
                          <textarea
                            value={guestPostData.metaDescription || ''}
                            readOnly
                            disabled
                            rows={4}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 text-lg font-semibold resize-none opacity-60 cursor-not-allowed"
                          />
                          <span className="absolute bottom-4 right-4 text-sm text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium">{(guestPostData.metaDescription || '').length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Keywords Section */}
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/60 overflow-hidden hover:shadow-3xl transition-all duration-300">
                    <div className="bg-yellow-500 px-4 py-3">
                      <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold">K</span>
                        </div>
                        <span>Keywords</span>
                      </h2>
                    </div>
                    <div className="p-4">
                      <label className="block text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-4"></div>
                        Keywords *
                      </label>
                      <div className="relative group">
                        <input
                          type="text"
                          value={guestPostData.keywords || ''}
                          readOnly
                          disabled
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 text-lg font-semibold opacity-60 cursor-not-allowed"
                        />
                        <span className="absolute right-4 top-4 text-sm text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium">{(guestPostData.keywords || '').length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Link Insertion Display - keeping simpler for now */}
          {order?.type === 'linkInsertion' && linkInsertionData && (
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
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
