"use client"

import { useState } from 'react'
import { ExternalLink, Mail, Phone, Globe, Star, Users, TrendingUp, MessageSquare, DollarSign } from 'lucide-react'

interface Website {
  _id: string
  name: string
  url: string
  domain: string
  description?: string
  category: string
  domainAuthority?: number
  monthlyTraffic?: number
  language: string
  country: string
  pricing: {
    guestPost?: number
    linkInsertion?: number
  }
  requirements?: {
    minWordCount?: number
    maxLinks?: number
    allowedTopics?: string[]
    prohibitedTopics?: string[]
  }
  contactInfo?: {
    email?: string
    phone?: string
  }
  socialMedia?: {
    twitter?: string
    linkedin?: string
    facebook?: string
  }
  publisherId: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
}

interface WebsiteCardProps {
  website: Website
  onContact?: (website: Website) => void
}

export function WebsiteCard({ website, onContact }: WebsiteCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)

  const formatNumber = (num?: number) => {
    if (!num) return 'N/A'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatPrice = (price?: number) => {
    if (!price) return 'Contact for pricing'
    return `$${price.toLocaleString()}`
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      technology: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      business: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      health: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      finance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      education: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      lifestyle: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      travel: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      food: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      sports: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      entertainment: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
      news: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      fashion: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
      beauty: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200',
      parenting: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      home: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      automotive: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
      gaming: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
      photography: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      music: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
      art: 'bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-200',
      other: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200'
    }
    return colors[category] || colors.other
  }

  const description = website.description || ''
  const shouldTruncate = description.length > 150
  const displayDescription = showFullDescription || !shouldTruncate ? description : description.substring(0, 150) + '...'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {website.name}
            </h3>
            <div className="flex items-center space-x-2 mb-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <a
                href={website.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                {website.domain || website.url}
              </a>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(website.category)}`}>
                {website.category.charAt(0).toUpperCase() + website.category.slice(1)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {website.country} • {website.language.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {displayDescription}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-1"
              >
                {showFullDescription ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Domain Authority</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {website.domainAuthority || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Traffic</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatNumber(website.monthlyTraffic)}
              </p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-800 dark:text-green-200">Guest Post</span>
            </div>
            <p className="text-lg font-bold text-green-900 dark:text-green-100">
              {formatPrice(website.pricing?.guestPost)}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Link Insertion</span>
            </div>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {formatPrice(website.pricing?.linkInsertion)}
            </p>
          </div>
        </div>
      </div>

      {/* Requirements */}
      {website.requirements && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Requirements</h4>
          <div className="space-y-2">
            {website.requirements.minWordCount && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Min words:</span>
                <span className="text-sm text-gray-900 dark:text-white">{website.requirements.minWordCount}</span>
              </div>
            )}
            {website.requirements.maxLinks && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Max links:</span>
                <span className="text-sm text-gray-900 dark:text-white">{website.requirements.maxLinks}</span>
              </div>
            )}
            {website.requirements.allowedTopics && website.requirements.allowedTopics.length > 0 && (
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Allowed topics:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {website.requirements.allowedTopics.slice(0, 3).map((topic, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                      {topic}
                    </span>
                  ))}
                  {website.requirements.allowedTopics.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{website.requirements.allowedTopics.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Publisher Info */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {website.publisherId.firstName} {website.publisherId.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{website.publisherId.email}</p>
            </div>
          </div>
          <button
            onClick={() => onContact?.(website)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            Contact
          </button>
        </div>

        {/* Contact Info */}
        {website.contactInfo && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              {website.contactInfo.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a
                    href={`mailto:${website.contactInfo.email}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {website.contactInfo.email}
                  </a>
                </div>
              )}
              {website.contactInfo.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a
                    href={`tel:${website.contactInfo.phone}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {website.contactInfo.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
