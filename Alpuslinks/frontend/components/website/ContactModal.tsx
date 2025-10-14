"use client"

import { useState } from 'react'
import { X, Mail, Phone, MessageSquare, Send } from 'lucide-react'

interface Website {
  _id: string
  name: string
  url: string
  domain: string
  publisherId: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  contactInfo?: {
    email?: string
    phone?: string
  }
}

interface ContactModalProps {
  website: Website | null
  isOpen: boolean
  onClose: () => void
}

export function ContactModal({ website, isOpen, onClose }: ContactModalProps) {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    contactMethod: 'email'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !website) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // TODO: Implement actual contact functionality
      // This could send an email, create a message, or redirect to email client
      console.log('Contact form submitted:', {
        website: website.name,
        publisher: website.publisherId.email,
        ...formData
      })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Reset form and close modal
      setFormData({ subject: '', message: '', contactMethod: 'email' })
      onClose()
    } catch (error) {
      console.error('Error sending contact message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmailClick = () => {
    const subject = encodeURIComponent(`Inquiry about ${website.name} - ${formData.subject}`)
    const body = encodeURIComponent(formData.message)
    window.open(`mailto:${website.publisherId.email}?subject=${subject}&body=${body}`)
    onClose()
  }

  const handlePhoneClick = () => {
    if (website.contactInfo?.phone) {
      window.open(`tel:${website.contactInfo.phone}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Contact Publisher
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {website.name} - {website.domain}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Publisher Info */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                {website.publisherId.firstName[0]}{website.publisherId.lastName[0]}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {website.publisherId.firstName} {website.publisherId.lastName}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{website.publisherId.email}</p>
            </div>
          </div>

          {/* Contact Methods */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleEmailClick}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Send Email</span>
            </button>
            
            {website.contactInfo?.phone && (
              <button
                onClick={handlePhoneClick}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Call</span>
              </button>
            )}
          </div>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Guest Post Inquiry"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Tell the publisher about your project, budget, and requirements..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preferred Contact Method
              </label>
              <select
                value={formData.contactMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, contactMethod: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
