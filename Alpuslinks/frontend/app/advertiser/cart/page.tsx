"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { selectCartItems, selectCartSummary, removeItem, addItem, clearCart } from '@/store/slices/cartSlice'
import { ShoppingCart, Trash2, CreditCard, Shield, Sparkles, ArrowRight, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { apiService } from '@/lib/api'

interface Post {
  _id: string
  title: string
  domain: string
  completeUrl: string
  anchorPairs: Array<{
    text: string
    link: string
  }>
  status: string
}

export default function AdvertiserCartPage() {
  const items = useAppSelector(selectCartItems)
  const summary = useAppSelector(selectCartSummary)
  const dispatch = useAppDispatch()
  const router = useRouter()
  
  const [linkInsertionPosts, setLinkInsertionPosts] = useState<Post[]>([])
  const [selectedLIItems, setSelectedLIItems] = useState<Record<string, string>>({})
  const [loadingLI, setLoadingLI] = useState(false)
  
  const [writingGPPosts, setWritingGPPosts] = useState<Post[]>([])
  const [selectedWGPItems, setSelectedWGPItems] = useState<Record<string, string>>({})
  const [loadingWGP, setLoadingWGP] = useState(false)

  // Helper function to extract domain from completeUrl
  const getDomainFromUrl = (url: string): string => {
    if (!url) return 'Not specified'
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      return urlObj.hostname.replace('www.', '')
    } catch (e) {
      return 'Invalid URL'
    }
  }

  // Fetch Link Insertion posts
  const fetchLinkInsertionPosts = async () => {
    try {
      setLoadingLI(true)
      const response = await apiService.getPosts()
      const allPosts = response.data?.posts || []
      
      // Filter for Link Insertion posts using the same logic as post management page
      const liPosts = allPosts.filter((post: Post) => {
        // Check if it's a Link Insertion post (not Writing + GP)
        const isLinkInsertion = post.title === 'Link Insertion Request' || 
                               post.title.includes('Link Insertion') ||
                               (post.anchorPairs && post.anchorPairs.length > 0 && 
                                !post.title.includes('Writing') && 
                                !post.title.includes('GP') &&
                                post.title !== 'Writing + GP' &&
                                post.title.length > 3) // Exclude short titles that are likely Writing + GP
        
        return isLinkInsertion
      })
      
      setLinkInsertionPosts(liPosts)
    } catch (error: any) {
      console.error('Failed to fetch Link Insertion posts:', error)
    } finally {
      setLoadingLI(false)
    }
  }

  // Fetch Writing + GP posts
  const fetchWritingGPPosts = async () => {
    try {
      setLoadingWGP(true)
      const response = await apiService.getPosts()
      const allPosts = response.data?.posts || []
      
      // Filter for Writing + GP posts using the same logic as post management page
      const wgpPosts = allPosts.filter((post: Post) => {
        // Check if it's a Writing + GP post
        const isWritingGP = post.title === 'Writing + GP' || 
                           post.title.includes('Writing') || 
                           post.title.includes('GP') ||
                           post.title === 'ad' || // Based on your current post
                           post.title.length <= 3 || // Short titles are likely Writing + GP
                           (!post.anchorPairs || post.anchorPairs.length === 0) // No anchor pairs suggests Writing + GP
        
        return isWritingGP
      })
      
      setWritingGPPosts(wgpPosts)
    } catch (error: any) {
      console.error('Failed to fetch Writing + GP posts:', error)
    } finally {
      setLoadingWGP(false)
    }
  }

  // Get Link Insertion posts for a specific domain
  const getLIForDomain = (domain: string): Post[] => {
    return linkInsertionPosts.filter(post => {
      const postDomain = post.domain || getDomainFromUrl(post.completeUrl)
      return postDomain.toLowerCase() === domain.toLowerCase()
    })
  }

  // Check if there are Link Insertion posts for a domain
  const hasLIForDomain = (domain: string): boolean => {
    return getLIForDomain(domain).length > 0
  }

  // Handle LI item selection
  const handleLISelection = (cartItemId: string, postId: string) => {
    setSelectedLIItems(prev => ({
      ...prev,
      [cartItemId]: postId
    }))
  }

  // Get Writing + GP posts for a specific domain
  const getWGPForDomain = (domain: string): Post[] => {
    return writingGPPosts.filter(post => {
      const postDomain = post.domain || getDomainFromUrl(post.completeUrl)
      return postDomain.toLowerCase() === domain.toLowerCase()
    })
  }

  // Check if there are Writing + GP posts for a domain
  const hasWGPForDomain = (domain: string): boolean => {
    return getWGPForDomain(domain).length > 0
  }

  // Handle Writing + GP item selection
  const handleWGPSelection = (cartItemId: string, postId: string) => {
    setSelectedWGPItems(prev => ({
      ...prev,
      [cartItemId]: postId
    }))
  }

  // Fetch posts on component mount
  useEffect(() => {
    fetchLinkInsertionPosts()
    fetchWritingGPPosts()
  }, [])

  const handleAddService = (websiteId: string, domain: string, type: 'guestPost' | 'linkInsertion' | 'writingGuestPost', price: number) => {
    dispatch(addItem({
      websiteId,
      domain,
      type,
      price,
    }))
  }

  const handleAddGP = (websiteId: string, domain: string, price: number) => {
    // Navigate to create post page with the specific domain
    router.push(`/advertiser/posts/create?domain=${encodeURIComponent(domain)}`)
  }

  const handleAddLI = (websiteId: string, domain: string, price: number) => {
    // Navigate to create link insertion page
    router.push('/advertiser/posts/link-insertion/create')
  }

  const handleAddWritingGP = (websiteId: string, domain: string, price: number) => {
    // Navigate to create writing + GP page with cart flag and domain
    router.push(`/advertiser/posts/writing-gp?from=cart&domain=${encodeURIComponent(domain)}`)
  }

  return (
    <ProtectedRoute allowedRoles={["advertiser"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Your Cart
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
                </p>
              </div>
            </div>
            {items.length > 0 && (
              <button 
                onClick={() => dispatch(clearCart())} 
                className="group flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Clear cart</span>
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                <ShoppingCart className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Start building your campaign by browsing our available websites and adding services to your cart.
              </p>
              <a 
                href="/advertiser/websites" 
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Sparkles className="w-5 h-5" />
                <span>Browse Websites</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
                  <div className="bg-blue-600 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                      <ShoppingCart className="w-5 h-5" />
                      <span>Cart Items</span>
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                    {items.map((item, index) => (
                      <div key={item.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all duration-200 group">
                        <div className="flex items-start space-x-4">
                          {/* Favicon with enhanced styling */}
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                              <img 
                                alt={item.domain} 
                                src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=64`} 
                                className="w-7 h-7 rounded-lg" 
                              />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">{item.quantity}</span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {item.domain}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                                  {item.domain}
                                </p>
                              </div>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                item.type === 'guestPost' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : item.type === 'linkInsertion'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              }`}>
                                {item.type === 'guestPost' ? 'Guest Post' : 
                                 item.type === 'linkInsertion' ? 'Link Insertion' : 
                                 'Writing + GP'}
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Price:</span>
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                  ${item.price.toFixed(2)}
                                </span>
                              </div>

                              {/* Show selected LI item details */}
                              {item.type === 'linkInsertion' && selectedLIItems[item.id] && (
                                <div className="w-full mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                  <div className="flex items-start space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                        Selected Link Insertion Item:
                                      </p>
                                      {(() => {
                                        const selectedPost = linkInsertionPosts.find(post => post._id === selectedLIItems[item.id])
                                        return selectedPost ? (
                                          <div className="mt-1 space-y-1">
                                            <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                                              {selectedPost.title}
                                            </p>
                                            {selectedPost.anchorPairs && selectedPost.anchorPairs.length > 0 && (
                                              <div className="space-y-1">
                                                <p className="text-xs text-green-600 dark:text-green-400">
                                                  Anchor Links ({selectedPost.anchorPairs.length}):
                                                </p>
                                                {selectedPost.anchorPairs.map((pair, idx) => (
                                                  <div key={idx} className="text-xs text-green-600 dark:text-green-400">
                                                    <span className="font-medium">"{pair.text}"</span> → 
                                                    <span className="ml-1 text-blue-600 dark:text-blue-400">{pair.link}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ) : null
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Show selected Writing + GP item details */}
                              {item.type === 'writingGuestPost' && selectedWGPItems[item.id] && (
                                <div className="w-full mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                  <div className="flex items-start space-x-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                                        Selected Writing + GP Item:
                                      </p>
                                      {(() => {
                                        const selectedPost = writingGPPosts.find(post => post._id === selectedWGPItems[item.id])
                                        return selectedPost ? (
                                          <div className="mt-1 space-y-1">
                                            <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                                              {selectedPost.title}
                                            </p>
                                            {selectedPost.anchorPairs && selectedPost.anchorPairs.length > 0 && (
                                              <div className="space-y-1">
                                                <p className="text-xs text-purple-600 dark:text-purple-400">
                                                  Anchor Links ({selectedPost.anchorPairs.length}):
                                                </p>
                                                {selectedPost.anchorPairs.map((pair, idx) => (
                                                  <div key={idx} className="text-xs text-purple-600 dark:text-purple-400">
                                                    <span className="font-medium">"{pair.text}"</span> → 
                                                    <span className="ml-1 text-blue-600 dark:text-blue-400">{pair.link}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ) : null
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Show only matching service button */}
                              <div className="flex items-center space-x-2">
                                {item.type === 'guestPost' && (
                                  <button
                                    onClick={() => handleAddGP(item.websiteId, item.domain, item.price)}
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add GP</span>
                                  </button>
                                )}
                                {item.type === 'linkInsertion' && (
                                  <div className="flex items-center space-x-2">
                                    {hasLIForDomain(item.domain) ? (
                                      <div className="flex items-center space-x-2">
                                        <select
                                          value={selectedLIItems[item.id] || ''}
                                          onChange={(e) => handleLISelection(item.id, e.target.value)}
                                          className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        >
                                          <option value="">Select LI Item</option>
                                          {getLIForDomain(item.domain).map((post) => (
                                            <option key={post._id} value={post._id}>
                                              {post.title} - {post.anchorPairs?.length || 0} anchor(s)
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleAddLI(item.websiteId, item.domain, item.price)}
                                        className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Add LI</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                                {item.type === 'writingGuestPost' && (
                                  <div className="flex items-center space-x-2">
                                    {hasWGPForDomain(item.domain) ? (
                                      <div className="flex items-center space-x-2">
                                        <select
                                          value={selectedWGPItems[item.id] || ''}
                                          onChange={(e) => handleWGPSelection(item.id, e.target.value)}
                                          className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        >
                                          <option value="">Select WP+GP Item</option>
                                          {getWGPForDomain(item.domain).map((post) => (
                                            <option key={post._id} value={post._id}>
                                              {post.title} - {post.anchorPairs?.length || 0} anchor(s)
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleAddWritingGP(item.websiteId, item.domain, item.price)}
                                        className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Add WP+GP</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="ml-auto flex items-center space-x-4">
                                <div className="text-right">
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </div>
                                </div>
                                <button
                                  onClick={() => dispatch(removeItem({ id: item.id }))}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enhanced Order Summary */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-8 space-y-6">
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
                    <div className="bg-green-600 px-6 py-4">
                      <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                        <CreditCard className="w-5 h-5" />
                        <span>Order Summary</span>
                      </h2>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 dark:text-gray-400">Items ({summary.quantity})</span>
                          <span className="font-medium text-gray-900 dark:text-white">{summary.quantity}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">Subtotal</span>
                          <span className="text-xl font-bold text-gray-900 dark:text-white">${summary.subtotal.toFixed(2)}</span>
                        </div>
                      </div>


                      {/* Checkout button */}
                      <button className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2">
                        <CreditCard className="w-5 h-5" />
                        <span>Proceed to Checkout</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Security notice */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Secure Checkout</h4>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          Your payment information is encrypted and secure. You can review your order before paying.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}


