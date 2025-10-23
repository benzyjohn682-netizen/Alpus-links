"use client"
import { useState, useEffect } from 'react'
import { apiService } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { SimpleSelect } from '@/components/ui/simple-select'
import toast from 'react-hot-toast'
import { X, Tag, FileText, Hash } from 'lucide-react'

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  color: string
  icon: string
  isActive: boolean
  isSystem?: boolean
  sortOrder: number
}

interface CategoryFormProps {
  category?: Category | null
  onClose: () => void
  onSuccess: () => void
}

const colorOptions = [
  { value: '#3B82F6', label: 'Blue', color: '#3B82F6' },
  { value: '#10B981', label: 'Green', color: '#10B981' },
  { value: '#F59E0B', label: 'Yellow', color: '#F59E0B' },
  { value: '#EF4444', label: 'Red', color: '#EF4444' },
  { value: '#8B5CF6', label: 'Purple', color: '#8B5CF6' },
  { value: '#EC4899', label: 'Pink', color: '#EC4899' },
  { value: '#06B6D4', label: 'Cyan', color: '#06B6D4' },
  { value: '#84CC16', label: 'Lime', color: '#84CC16' },
  { value: '#F97316', label: 'Orange', color: '#F97316' },
  { value: '#6B7280', label: 'Gray', color: '#6B7280' }
]

const iconOptions = [
  { value: 'tag', label: 'Tag' },
  { value: 'folder', label: 'Folder' },
  { value: 'bookmark', label: 'Bookmark' },
  { value: 'star', label: 'Star' },
  { value: 'heart', label: 'Heart' },
  { value: 'thumbs-up', label: 'Thumbs Up' },
  { value: 'flag', label: 'Flag' },
  { value: 'award', label: 'Award' },
  { value: 'target', label: 'Target' },
  { value: 'zap', label: 'Zap' }
]

export function CategoryForm({ category, onClose, onSuccess }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'tag',
    sortOrder: 0,
    isActive: true
  })
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        color: category.color,
        icon: category.icon,
        sortOrder: category.sortOrder,
        isActive: category.isActive
      })
    }
  }, [category])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      setLoading(true)
      
      const data = {
        ...formData
      }

      let response
      if (category) {
        response = await apiService.put(`/categories/${category._id}`, data)
      } else {
        response = await apiService.post('/categories', data)
      }

      if (response.data && (response.data as any).success) {
        toast.success(`Category ${category ? 'updated' : 'created'} successfully`)
        onSuccess()
        onClose()
      } else {
        toast.error((response.data as any)?.message || `Failed to ${category ? 'update' : 'create'} category`)
      }
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error(`Failed to ${category ? 'update' : 'create'} category`)
    } finally {
      setLoading(false)
    }
  }

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {category ? 'Edit Category' : 'Add New Category'}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category Name *
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort Order
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter category description (optional)"
                  rows={3}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      className={`w-8 h-8 rounded-lg border-2 ${
                        formData.color === color.value
                          ? 'border-gray-900 dark:border-white'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: color.color }}
                    />
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#3B82F6"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Icon
                </label>
                <SimpleSelect
                  value={formData.icon}
                  onChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                  options={iconOptions}
                />
              </div>
            </div>


            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-white">
                Active
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
