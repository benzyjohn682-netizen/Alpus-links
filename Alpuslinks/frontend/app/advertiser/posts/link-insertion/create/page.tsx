"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Send } from 'lucide-react'
import { apiService } from '@/lib/api'
import toast from 'react-hot-toast'

interface LinkInsertionAsPost {
  title: string
  completeUrl: string
  content: string
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  anchorPairs: Array<{ text: string; link: string }>
}

export default function CreateLinkInsertionAsPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<LinkInsertionAsPost>({
    title: '',
    completeUrl: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    anchorPairs: [
      { text: '', link: '' }
    ],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const isValidUrl = (url: string) => {
    try { new URL(url); return true } catch { return false }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!formData.title.trim()) e.title = 'Title is required'
    
    // Check if completeUrl is provided and valid
    if (!formData.completeUrl.trim()) {
      e.completeUrl = 'Post URL is required'
    } else {
      // Test both the original URL and the formatted URL
      const formattedUrl = formatUrl(formData.completeUrl)
      console.log('Validating URL:', { original: formData.completeUrl, formatted: formattedUrl })
      if (!isValidUrl(formData.completeUrl) && !isValidUrl(formattedUrl)) {
        e.completeUrl = 'Valid Post URL required'
      }
    }
    
    const pair = formData.anchorPairs[0]
    if (!pair.text.trim()) e.anchorText = 'Anchor text required'
    if (!pair.link.trim() || !isValidUrl(pair.link)) e.anchorUrl = 'Valid anchor URL required'
    setErrors(e)
    console.log('Validation errors:', e)
    return Object.keys(e).length === 0
  }

  const formatUrl = (url: string): string => {
    if (!url.trim()) return ''
    
    // If URL already has protocol, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    
    // Add https:// protocol if missing
    return `https://${url}`
  }

  const setField = (key: keyof LinkInsertionAsPost, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const setAnchorPair = (idx: number, key: 'text' | 'link', value: string) => {
    setFormData(prev => {
      const next = [...prev.anchorPairs]
      next[idx] = { ...next[idx], [key]: value }
      return { ...prev, anchorPairs: next }
    })
  }

  const saveDraft = async () => {
    if (!validate()) return toast.error('Please fix errors')
    try {
      setSaving(true)
      await apiService.savePostDraft({
        title: formData.title,
        completeUrl: formatUrl(formData.completeUrl),
        content: formData.content,
        metaTitle: formData.metaTitle || '',
        metaDescription: formData.metaDescription || '',
        keywords: formData.keywords || '',
        anchorPairs: formData.anchorPairs,
      })
      toast.success('Draft saved')
      router.push('/advertiser/posts')
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const submit = async () => {
    if (!validate()) return toast.error('Please fix errors')
    try {
      setSaving(true)
      const submitData = {
        title: formData.title,
        completeUrl: formatUrl(formData.completeUrl),
        content: formData.content,
        metaTitle: formData.metaTitle || '',
        metaDescription: formData.metaDescription || '',
        keywords: formData.keywords || '',
        anchorPairs: formData.anchorPairs,
      }
      
      console.log('Submitting Link Insertion post:', submitData)
      await apiService.submitPost(submitData)
      toast.success('Submitted for review')
      router.push('/advertiser/posts')
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || 'Failed to submit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["advertiser"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3 mb-8">
            <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Link Insertion</h1>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
              <input 
                value={formData.title} 
                onChange={e => setField('title', e.target.value)} 
                className={`w-full px-3 py-2 rounded-xl border ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} 
                placeholder="Enter link insertion title" 
              />
              {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Post URL</label>
              <input value={formData.completeUrl} onChange={e => setField('completeUrl', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${errors.completeUrl ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} placeholder="https://example.com/post" />
              {errors.completeUrl && <p className="text-sm text-red-600 mt-1">{errors.completeUrl}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Anchor Text</label>
                <input value={formData.anchorPairs[0].text} onChange={e => setAnchorPair(0, 'text', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${errors.anchorText ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} placeholder="Click here" />
                {errors.anchorText && <p className="text-sm text-red-600 mt-1">{errors.anchorText}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Anchor URL</label>
                <input value={formData.anchorPairs[0].link} onChange={e => setAnchorPair(0, 'link', e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${errors.anchorUrl ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} placeholder="https://target.com/page" />
                {errors.anchorUrl && <p className="text-sm text-red-600 mt-1">{errors.anchorUrl}</p>}
              </div>
            </div>

            {/* Short Description field removed as requested */}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
              <textarea value={formData.content} onChange={e => setField('content', e.target.value)} rows={6} className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>

            <div className="flex gap-3">
              <button onClick={saveDraft} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-xl disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </button>
              <button onClick={submit} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                <Send className="w-4 h-4" />
                <span>{saving ? 'Submitting...' : 'Submit for Review'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}


