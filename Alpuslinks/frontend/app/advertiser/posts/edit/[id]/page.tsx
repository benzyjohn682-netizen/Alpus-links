"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Send, Link, Unlink, Image, Table, Minus, Play, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Quote, Bold, Italic, Strikethrough, Subscript, Superscript, Maximize2, Type, Palette, RotateCcw, RotateCw, HelpCircle, MoreHorizontal, Code, Eye, Plus } from 'lucide-react'
import CodeEditor from '@/components/editor/CodeEditor'
import RichTextEditor from '@/components/editor/RichTextEditor'
import { apiService } from '@/lib/api'
import toast from 'react-hot-toast'

interface AnchorPair {
  id: string
  text: string
  link: string
}

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = (params?.id as string) || ''
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    domain: '',
    slug: '',
    description: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    content: ''
  })
  const [domainError, setDomainError] = useState('')
  const [anchorPairs, setAnchorPairs] = useState<AnchorPair[]>([])
  const [newAnchorText, setNewAnchorText] = useState('')
  const [newAnchorLink, setNewAnchorLink] = useState('')
  const [showFormatDropdown, setShowFormatDropdown] = useState(false)
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false)
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual')
  const [showToolbar, setShowToolbar] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      if (!postId) return
      try {
        setLoading(true)
        const { data } = await apiService.getPost(postId)
        const p = data?.post
        if (!p) throw new Error('Post not found')
        
        // Extract domain and slug from completeUrl or use separate fields
        let domain = p.domain || ''
        let slug = p.slug || ''
        
        console.log('Post data:', { completeUrl: p.completeUrl, domain: p.domain, slug: p.slug })
        
        if (p.completeUrl) {
          try {
            const urlObj = new URL(p.completeUrl.startsWith('http') ? p.completeUrl : `https://${p.completeUrl}`)
            domain = `${urlObj.protocol}//${urlObj.hostname}`
            slug = urlObj.pathname.replace(/^\//, '') || 'untitled'
            console.log('Parsed URL:', { domain, slug })
          } catch (e) {
            console.log('URL parsing failed, trying manual extraction')
            // If URL parsing fails, try to extract manually
            const parts = p.completeUrl.split('/')
            if (parts.length >= 3) {
              domain = `${parts[0]}//${parts[2]}`
              slug = parts.slice(3).join('/') || 'untitled'
            } else {
              // If it's not a complete URL, treat it as just a slug
              slug = p.completeUrl || 'untitled'
              domain = ''
            }
            console.log('Manual extraction:', { domain, slug })
          }
        }
        
        setFormData({
          title: p.title || '',
          domain: domain,
          slug: slug,
          description: p.description || '',
          metaTitle: p.metaTitle || '',
          metaDescription: p.metaDescription || '',
          keywords: p.keywords || '',
          content: p.content || ''
        })
        
        setAnchorPairs(Array.isArray(p.anchorPairs) ? p.anchorPairs.map((pair: any, index: number) => ({
          id: index.toString(),
          text: pair.text || '',
          link: pair.link || ''
        })) : [])
        
        updateWordCount(p.content || '')
        setInitialLoadComplete(true)
      } catch (e: any) {
        console.error(e)
        toast.error(e?.message || 'Failed to load post')
        router.push('/advertiser/posts')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [postId, router])

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && initialLoadComplete) {
      const newSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .trim()
      
      // Only update slug if it's empty or matches the old pattern
      if (!formData.slug || formData.slug === 'untitled' || formData.slug === '') {
        setFormData(prev => ({ ...prev, slug: newSlug }))
      }
    } else if (!formData.title && initialLoadComplete) {
      setFormData(prev => ({ ...prev, slug: '' }))
    }
  }, [formData.title, initialLoadComplete]) // Only re-run when title changes and after initial load

  // Ensure slug is properly formatted for backend validation
  const formatSlugForBackend = (slug: string): string => {
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '') // Only allow lowercase letters, numbers, and hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .trim() || 'untitled'
  }

  // Domain validation function
  const validateDomain = (domain: string): string => {
    if (!domain) return ''
    
    try {
      // Try to parse as URL, add protocol if missing
      const testUrl = domain.startsWith('http') ? domain : `https://${domain}`
      new URL(testUrl)
      return ''
    } catch {
      return 'Please enter a valid domain (e.g., https://example.com or example.com)'
    }
  }

  // Extract slug from complete URL
  const extractSlugFromUrl = (url: string): string => {
    if (!url) return 'untitled'
    
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      const pathname = urlObj.pathname
      // Remove leading slash and return the path
      const slug = pathname.replace(/^\//, '') || 'untitled'
      return formatSlugForBackend(slug)
    } catch {
      // If URL parsing fails, treat the whole string as slug
      const slug = url.replace(/^https?:\/\//, '').replace(/^[^\/]+\//, '') || 'untitled'
      return formatSlugForBackend(slug)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Validate domain when it changes
    if (field === 'domain') {
      const error = validateDomain(value)
      setDomainError(error)
    }
  }

  const addAnchorPair = () => {
    if (newAnchorText.trim() && newAnchorLink.trim()) {
      const newPair: AnchorPair = {
        id: Date.now().toString(),
        text: newAnchorText.trim(),
        link: newAnchorLink.trim()
      }
      setAnchorPairs(prev => [...prev, newPair])
      setNewAnchorText('')
      setNewAnchorLink('')
    }
  }

  const removeAnchorPair = (id: string) => {
    setAnchorPairs(prev => prev.filter(pair => pair.id !== id))
  }

  const handleSaveDraft = async () => {
    try {
      setSaving(true)
      // Combine domain + slug into complete URL
      const completeUrl = formData.domain && formData.slug 
        ? `${formData.domain}/${formData.slug}`
        : formData.domain || formData.slug || ''
      
      const payload = {
        title: formData.title,
        completeUrl: completeUrl,
        description: formData.description,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        keywords: formData.keywords,
        content: formData.content,
        anchorPairs: anchorPairs.map(p => ({ text: p.text, link: p.link }))
      }
      console.log('Updating post with payload:', payload)
      await apiService.updatePost(postId, payload)
      toast.success('Post updated')
      router.push('/advertiser/posts')
    } catch (e: any) {
      console.error('Post update error:', e)
      toast.error(e?.message || 'Failed to update post')
    } finally {
      setSaving(false)
    }
  }

  const handleSendToModeration = async () => {
    try {
      setSaving(true)
      // Combine domain + slug into complete URL
      const completeUrl = formData.domain && formData.slug 
        ? `${formData.domain}/${formData.slug}`
        : formData.domain || formData.slug || ''
      
      // Validate required fields before submission
      if (!formData.title.trim()) {
        toast.error('Title is required')
        return
      }
      if (!completeUrl.trim()) {
        toast.error('Complete URL is required. Please enter both domain and slug.')
        return
      }
      if (!formData.content.trim()) {
        toast.error('Content is required')
        return
      }
      
      const payload = {
        title: formData.title,
        completeUrl: completeUrl,
        description: formData.description,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        keywords: formData.keywords,
        content: formData.content,
        anchorPairs: anchorPairs.map(p => ({ text: p.text, link: p.link }))
      }
      
      console.log('Submitting post with payload:', payload)
      console.log('Complete URL being sent:', completeUrl)
      console.log('Title being sent:', formData.title)
      console.log('Content being sent:', formData.content)
      
      await apiService.submitPost(payload)
      toast.success('Post submitted for moderation')
      router.push('/advertiser/posts')
    } catch (e: any) {
      console.error('Post submission error:', e)
      console.error('Error details:', e.response?.data || e.message)
      toast.error(e?.message || 'Failed to submit post')
    } finally {
      setSaving(false)
    }
  }

  // Rich text editor functions (same as create page)
  const executeCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
      document.execCommand(command, false, value)
    }
  }

  const formatText = (format: string) => {
    if (!editorRef.current) return

    const editor = editorRef.current
    editor.focus()

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    
    if (selection.toString() === '') {
      let blockElement = range.commonAncestorContainer
      if (blockElement.nodeType === Node.TEXT_NODE) {
        blockElement = blockElement.parentElement!
      }
      
      while (blockElement && blockElement.nodeType === Node.ELEMENT_NODE && !['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV'].includes((blockElement as Element).tagName)) {
        blockElement = blockElement.parentElement!
      }
      
      if (blockElement) {
        range.selectNodeContents(blockElement)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }

    switch (format) {
      case 'bold':
        executeCommand('bold')
        break
      case 'italic':
        executeCommand('italic')
        break
      case 'underline':
        executeCommand('underline')
        break
      case 'heading1':
        wrapSelectionInTag('h1')
        break
      case 'heading2':
        wrapSelectionInTag('h2')
        break
      case 'normal':
        wrapSelectionInTag('p')
        break
    }
  }

  const wrapSelectionInTag = (tagName: string) => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      const editor = editorRef.current
      const newElement = document.createElement(tagName)
      newElement.innerHTML = '&nbsp;'
      editor.appendChild(newElement)
      
      const range = document.createRange()
      range.selectNodeContents(newElement)
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
      
      const content = editor.innerHTML
      handleInputChange('content', content)
      updateWordCount(content)
      return
    }

    const range = selection.getRangeAt(0)
    const selectedText = selection.toString()
    
    if (selectedText) {
      const newElement = document.createElement(tagName)
      newElement.innerHTML = selectedText
      
      range.deleteContents()
      range.insertNode(newElement)
      
      selection.removeAllRanges()
    } else {
      const blockElement = range.commonAncestorContainer
      let elementToWrap = blockElement
      
      if (blockElement.nodeType === Node.TEXT_NODE) {
        elementToWrap = blockElement.parentElement!
      }
      
      while (elementToWrap && elementToWrap.nodeType === Node.ELEMENT_NODE && !['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV'].includes((elementToWrap as Element).tagName)) {
        elementToWrap = elementToWrap.parentElement!
      }
      
      if (elementToWrap && elementToWrap.nodeType === Node.ELEMENT_NODE && (elementToWrap as Element).tagName !== tagName.toUpperCase()) {
        const newElement = document.createElement(tagName)
        newElement.innerHTML = (elementToWrap as Element).innerHTML
        elementToWrap.parentNode?.replaceChild(newElement, elementToWrap)
      }
    }
    
    const content = editorRef.current?.innerHTML || ''
    handleInputChange('content', content)
    updateWordCount(content)
  }

  const insertImage = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      executeCommand('insertImage', url)
    }
  }

  const insertCode = () => {
    executeCommand('insertHTML', '<code></code>')
  }

  const insertHorizontalRule = () => {
    executeCommand('insertHorizontalRule')
  }

  const insertReadMore = () => {
    executeCommand('insertHTML', '<!--more-->')
  }

  const insertSpecialChar = () => {
    const char = prompt('Enter special character:')
    if (char) {
      executeCommand('insertText', char)
    }
  }

  const clearFormatting = () => {
    executeCommand('removeFormat')
  }

  const indentText = () => {
    executeCommand('indent')
  }

  const outdentText = () => {
    executeCommand('outdent')
  }

  const undo = () => {
    executeCommand('undo')
  }

  const redo = () => {
    executeCommand('redo')
  }

  const changeTextColor = () => {
    const color = prompt('Enter color (e.g., #ff0000 or red):')
    if (color) {
      executeCommand('foreColor', color)
    }
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      executeCommand('createLink', url)
    }
  }

  const removeLink = () => {
    executeCommand('unlink')
  }

  const insertList = (ordered: boolean = false) => {
    if (ordered) {
      executeCommand('insertOrderedList')
    } else {
      executeCommand('insertUnorderedList')
    }
  }

  const insertBlockquote = () => {
    executeCommand('formatBlock', 'blockquote')
  }

  const alignText = (alignment: string) => {
    executeCommand('justify' + alignment.charAt(0).toUpperCase() + alignment.slice(1))
  }

  const insertTable = () => {
    const rows = prompt('Number of rows:', '2')
    const cols = prompt('Number of columns:', '2')
    if (rows && cols) {
      let table = '<table border="1">'
      for (let i = 0; i < parseInt(rows); i++) {
        table += '<tr>'
        for (let j = 0; j < parseInt(cols); j++) {
          table += '<td>&nbsp;</td>'
        }
        table += '</tr>'
      }
      table += '</table>'
      executeCommand('insertHTML', table)
    }
  }

  const updateWordCount = (content: string) => {
    const textContent = content.replace(/<[^>]*>/g, '').trim()
    const words = textContent.split(/\s+/).filter(word => word.length > 0)
    setWordCount(words.length)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFormatDropdown) {
        setShowFormatDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFormatDropdown])

  return (
    <ProtectedRoute allowedRoles={["advertiser"]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  Edit Post
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Edit and update your guest post with professional editing tools
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

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Loading post...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Main Content Editor */}
              <div className="xl:col-span-3">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/50 overflow-hidden hover:shadow-3xl transition-all duration-300">
                  <div className="p-8">
                    {/* Article Title */}
                    <div className="mb-8">
                      <label className="block text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                        <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mr-4"></div>
                        Article Title *
                      </label>
                      <div className="relative group">
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="Type here your creative post name"
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 text-lg font-semibold"
                        />
                        <span className="absolute right-4 top-4 text-sm text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium">{formData.title.length}</span>
                      </div>
                    </div>

                    {/* Domain */}
                    <div className="mb-8">
                      <label className="block text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                        <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mr-4"></div>
                        Target Domain *
                      </label>
                      <div className="relative group">
                        <input
                          type="url"
                          value={formData.domain}
                          onChange={(e) => {
                            const domain = e.target.value
                            handleInputChange('domain', domain)
                          }}
                          placeholder="https://example.com"
                          className={`w-full px-4 py-3 border-2 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-4 transition-all duration-300 text-lg font-mono ${
                            domainError 
                              ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
                              : 'border-gray-200 dark:border-gray-700 focus:ring-purple-500/20 focus:border-purple-500'
                          }`}
                        />
                        <span className="absolute right-4 top-4 text-sm text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium">{formData.domain.length}</span>
                      </div>
                      {domainError ? (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <span className="w-4 h-4 mr-2">⚠️</span>
                          {domainError}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Enter the domain where you want to place your guest post (e.g., https://example.com).
                        </p>
                      )}
                    </div>

                    {/* URL Slug */}
                    <div className="mb-8">
                      <label className="block text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                        <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mr-4"></div>
                        URL Slug *
                      </label>
                      <div className="relative group">
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => {
                            const slug = e.target.value
                            handleInputChange('slug', slug)
                          }}
                          placeholder="your-article-slug"
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 text-lg font-mono"
                        />
                        <span className="absolute right-4 top-4 text-sm text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium">{formData.slug.length}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Auto-generated from title. Only lowercase letters, numbers, and hyphens allowed.
                      </p>
                      {formData.domain && formData.slug && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Complete URL Preview:</p>
                          <p className="text-lg font-mono text-gray-900 dark:text-white">
                            {formData.domain}/{formData.slug}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Description Editor */}
                    <div className="mb-8">
                      <label className="block text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full mr-4"></div>
                        Description *
                      </label>
                      <div className="border-2 border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300">
                        {/* Editor Mode Tabs */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {/* Editor Mode Tabs */}
                              <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-lg">
                                <button
                                  onClick={() => setEditorMode('visual')}
                                  className={`flex items-center space-x-3 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
                                    editorMode === 'visual' 
                                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105' 
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
                                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105' 
                                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  <Code className="w-5 h-5" />
                                  <span>HTML</span>
                                </button>
                              </div>
                            </div>

                            {/* Fullscreen Toggle */}
                            <button
                              onClick={() => setIsFullscreen(!isFullscreen)}
                              className="p-3 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-gray-600 dark:text-gray-300 transition-all duration-200 hover:scale-110"
                              title="Toggle fullscreen"
                            >
                              <Maximize2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Content Area */}
                        <div className="relative">
                          {editorMode === 'visual' ? (
                            <RichTextEditor
                              value={formData.content}
                              onChange={(content) => {
                                handleInputChange('content', content)
                                updateWordCount(content)
                              }}
                              placeholder="Start writing your content here..."
                              height="450px"
                            />
                          ) : (
                            <CodeEditor
                              value={formData.content}
                              onChange={(value) => {
                                handleInputChange('content', value)
                                updateWordCount(value)
                              }}
                              language="html"
                              height="450px"
                              placeholder="Start typing your HTML code here..."
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
                    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-4 py-3">
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
                          <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mr-4"></div>
                          Meta Title *
                        </label>
                        <div className="relative group">
                          <input
                            type="text"
                            value={formData.metaTitle}
                            onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                            placeholder="Type here your meta title"
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 text-lg font-semibold"
                          />
                          <span className="absolute right-4 top-4 text-sm text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium">{formData.metaTitle.length}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                          <div className="w-3 h-3 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full mr-4"></div>
                          Meta Description *
                        </label>
                        <div className="relative group">
                          <textarea
                            value={formData.metaDescription}
                            onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                            placeholder="Briefly and succinctly describe what your post is about"
                            rows={4}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-300 text-lg font-semibold resize-none"
                          />
                          <span className="absolute bottom-4 right-4 text-sm text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium">{formData.metaDescription.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Keywords Section */}
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/60 overflow-hidden hover:shadow-3xl transition-all duration-300">
                    <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 px-4 py-3">
                      <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold">K</span>
                        </div>
                        <span>Keywords</span>
                      </h2>
                    </div>
                    <div className="p-4">
                      <label className="block text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                        <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mr-4"></div>
                        Keywords *
                      </label>
                      <div className="relative group">
                        <input
                          type="text"
                          value={formData.keywords}
                          onChange={(e) => handleInputChange('keywords', e.target.value)}
                          placeholder="Enter keywords separated by commas"
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all duration-300 text-lg font-semibold"
                        />
                        <span className="absolute right-4 top-4 text-sm text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium">{formData.keywords.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Anchor Text-Link Pairs */}
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/60 overflow-hidden hover:shadow-3xl transition-all duration-300">
                    <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 px-4 py-3">
                      <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold">A</span>
                        </div>
                        <span>Anchor Text-Link Pairs</span>
                      </h2>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      {/* Add new anchor pair */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mr-3"></div>
                            Anchor Text
                          </label>
                          <input
                            type="text"
                            value={newAnchorText}
                            onChange={(e) => setNewAnchorText(e.target.value)}
                            placeholder="Enter anchor text"
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 text-lg font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                            <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full mr-3"></div>
                            Anchor Link
                          </label>
                          <input
                            type="url"
                            value={newAnchorLink}
                            onChange={(e) => setNewAnchorLink(e.target.value)}
                            placeholder="Enter link URL"
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-lg font-semibold"
                          />
                        </div>
                        <button
                          onClick={addAnchorPair}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Plus className="w-5 h-5" />
                          <span>Add Anchor Pair</span>
                        </button>
                      </div>

                      {/* Display existing anchor pairs */}
                      {anchorPairs.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center">
                            <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mr-3"></div>
                            Added Pairs:
                          </h4>
                          {anchorPairs.map((pair) => (
                            <div key={pair.id} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300">
                              <div className="flex-1 min-w-0">
                                <div className="text-lg font-semibold text-gray-900 dark:text-white truncate mb-1">
                                  {pair.text}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 truncate font-mono">
                                  {pair.link}
                                </div>
                              </div>
                              <button
                                onClick={() => removeAnchorPair(pair.id)}
                                className="ml-4 p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                              >
                                <Unlink className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/50 overflow-hidden hover:shadow-3xl transition-all duration-300">
                    <div className="p-4 space-y-3">
                      <button
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
                      >
                        <Save className="w-5 h-5" />
                        <span>{saving ? 'Saving...' : 'Update Post'}</span>
                      </button>
                      <button
                        onClick={handleSendToModeration}
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
                      >
                        <Send className="w-5 h-5" />
                        <span>Submit for Moderation</span>
                      </button>
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


