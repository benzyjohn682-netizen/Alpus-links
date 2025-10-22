"use client"
import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { apiService } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { SimpleSelect } from '@/components/ui/simple-select'
import toast from 'react-hot-toast'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Tag,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import { CategoryForm } from '@/components/admin/CategoryForm'

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  color: string
  icon: string
  isActive: boolean
  sortOrder: number
  parentCategory?: {
    _id: string
    name: string
    slug: string
  }
  createdBy: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  updatedBy?: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface CategoryStats {
  total: number
  active: number
  inactive: number
  system: number
  custom: number
  parentCategories: number
  subcategories: number
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<CategoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('sortOrder')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchTerm,
        sortBy,
        sortOrder
      })

      if (statusFilter !== 'all') {
        params.append('isActive', statusFilter === 'active' ? 'true' : 'false')
      }


      const response = await apiService.get(`/categories?${params}`)
      
      if (response.data && (response.data as any).success) {
        const data = (response.data as any).data
        setCategories(data.categories || [])
        setTotalPages(data.pagination?.pages || 1)
        if (data.pagination?.total !== undefined) {
          setTotalCount(data.pagination.total)
        }
      } else {
        setError('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError('Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await apiService.get('/categories/stats/overview')
      if (response.data && (response.data as any).success) {
        setStats((response.data as any).data as CategoryStats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchStats()
  }, [currentPage, pageSize, searchTerm, statusFilter, sortBy, sortOrder])

  // Clear selection when categories change
  useEffect(() => {
    clearSelection()
  }, [categories])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }


  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!categoryToDelete) return

    try {
      const response = await apiService.delete(`/categories/${categoryToDelete._id}`)
      if (response.data && (response.data as any).success) {
        toast.success('Category deleted successfully')
        fetchCategories()
        fetchStats()
      } else {
        toast.error((response.data as any)?.message || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    } finally {
      setShowDeleteModal(false)
      setCategoryToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setCategoryToDelete(null)
  }

  const handleToggleStatus = async (category: Category) => {
    try {
      const response = await apiService.put(`/categories/${category._id}`, {
        isActive: !category.isActive
      })
      if (response.data && (response.data as any).success) {
        toast.success(`Category ${!category.isActive ? 'activated' : 'deactivated'} successfully`)
        fetchCategories()
        fetchStats()
      } else {
        toast.error((response.data as any)?.message || 'Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    }
  }

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const selectAllCategories = () => {
    const allCategoryIds = categories.map(cat => cat._id)
    setSelectedCategories(new Set(allCategoryIds))
  }

  const clearSelection = () => {
    setSelectedCategories(new Set())
  }

  const isAllSelected = selectedCategories.size === categories.length && categories.length > 0
  const isIndeterminate = selectedCategories.size > 0 && selectedCategories.size < categories.length

  const handleBulkDelete = () => {
    if (selectedCategories.size === 0) return
    setShowBulkDeleteModal(true)
  }

  const confirmBulkDelete = async () => {
    if (selectedCategories.size === 0) return
    
    const selectedList = Array.from(selectedCategories)
    const selectedCategoriesData = categories.filter(cat => selectedList.includes(cat._id))

    try {
      const deletePromises = selectedCategoriesData.map(cat => apiService.delete(`/categories/${cat._id}`))
      await Promise.all(deletePromises)
      
      toast.success(`${selectedCategoriesData.length} categories deleted successfully`)
      clearSelection()
      fetchCategories()
      fetchStats()
    } catch (error) {
      console.error('Error deleting categories:', error)
      toast.error('Failed to delete some categories')
    } finally {
      setShowBulkDeleteModal(false)
    }
  }

  const cancelBulkDelete = () => {
    setShowBulkDeleteModal(false)
  }

  const handleBulkStatusChange = async (isActive: boolean) => {
    if (selectedCategories.size === 0) return

    try {
      const updatePromises = Array.from(selectedCategories).map(id => 
        apiService.put(`/categories/${id}`, { isActive })
      )
      await Promise.all(updatePromises)
      
      toast.success(`${selectedCategories.size} categories ${isActive ? 'activated' : 'deactivated'} successfully`)
      clearSelection()
      fetchCategories()
      fetchStats()
    } catch (error) {
      console.error('Error updating categories:', error)
      toast.error('Failed to update some categories')
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    )
  }

  // Build a compact page list with ellipses for large page counts
  const getPageNumbers = (total: number, current: number) => {
    const pages: number[] = []
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i)
      return pages
    }
    const add = (n: number) => { if (!pages.includes(n)) pages.push(n) }
    add(1)
    const left = Math.max(2, current - 1)
    const right = Math.min(total - 1, current + 1)
    if (left > 2) add(-1) // ellipsis
    for (let i = left; i <= right; i++) add(i)
    if (right < total - 1) add(-1) // ellipsis
    add(total)
    return pages
  }


  if (loading && categories.length === 0) {
    return (
      <ProtectedRoute allowedRoles={["super admin", "admin"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading categories...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["super admin", "admin"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Category Management</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Manage content categories for websites and posts
                </p>
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Tag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Categories</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <EyeOff className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inactive}</p>
                  </div>
                </div>
              </div>
              
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search categories..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <SimpleSelect
                    value={statusFilter}
                    onChange={handleStatusFilter}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' }
                    ]}
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <SimpleSelect
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(value) => {
                      const [field, order] = value.split('-')
                      setSortBy(field)
                      setSortOrder(order)
                    }}
                    options={[
                      { value: 'sortOrder-asc', label: 'Sort Order (A-Z)' },
                      { value: 'sortOrder-desc', label: 'Sort Order (Z-A)' },
                      { value: 'name-asc', label: 'Name (A-Z)' },
                      { value: 'name-desc', label: 'Name (Z-A)' },
                      { value: 'createdAt-desc', label: 'Newest First' },
                      { value: 'createdAt-asc', label: 'Oldest First' }
                    ]}
                  />
                </div>

              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedCategories.size > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {selectedCategories.size} categor{selectedCategories.size === 1 ? 'y' : 'ies'} selected
                  </span>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    Clear selection
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusChange(true)}
                    className="text-green-600 hover:text-green-700 border-green-300 hover:border-green-400"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusChange(false)}
                    className="text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
                  >
                    <EyeOff className="w-4 h-4 mr-1" />
                    Deactivate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Categories Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = isIndeterminate
                        }}
                        onChange={() => isAllSelected ? clearSelection() : selectAllCategories()}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Sort Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {categories && categories.length > 0 ? categories.map((category) => (
                    <tr key={category._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      selectedCategories.has(category._id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCategories.has(category._id)}
                          onChange={() => toggleCategorySelection(category._id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-3"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {category.name}
                              </span>
                            </div>
                            {category.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(category.isActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {category.sortOrder}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(category)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                          >
                            {category.isActive ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingCategory(category)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(category)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        {loading ? 'Loading categories...' : 'No categories found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Show:</span>
                      <SimpleSelect
                        value={String(pageSize)}
                        onChange={(value) => {
                          setPageSize(parseInt(value) || 10)
                          setCurrentPage(1)
                        }}
                        options={[
                          { value: '5', label: '5' },
                          { value: '10', label: '10' },
                          { value: '20', label: '20' },
                          { value: '50', label: '50' }
                        ]}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">per page</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing{' '}
                        <span className="font-medium">
                          {Math.min((currentPage - 1) * pageSize + 1, Math.max(totalCount, 0))}
                        </span>
                        {' '}to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * pageSize, totalCount)}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium">{totalCount}</span>
                        {' '}results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className={`p-2 rounded-full transition-colors ${currentPage === 1 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        {getPageNumbers(totalPages, currentPage).map((page, idx) => (
                          page === -1 ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-white'
                                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        ))}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className={`p-2 rounded-full transition-colors ${currentPage === totalPages ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                          aria-label="Next page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Modals */}
          {showAddModal && (
            <CategoryForm
              onClose={() => setShowAddModal(false)}
              onSuccess={() => {
                fetchCategories()
                fetchStats()
              }}
            />
          )}

          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onClose={() => setEditingCategory(null)}
              onSuccess={() => {
                fetchCategories()
                fetchStats()
              }}
            />
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && categoryToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                        <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Delete Category
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Are you sure you want to delete the category{' '}
                      <span className="font-medium text-gray-900 dark:text-white">
                        "{categoryToDelete.name}"
                      </span>?
                    </p>
                    {categoryToDelete.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Description: {categoryToDelete.description}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={cancelDelete}
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={confirmDelete}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete Category
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Delete Confirmation Modal */}
          {showBulkDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                        <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Delete Categories
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Are you sure you want to delete{' '}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedCategories.size} categor{selectedCategories.size === 1 ? 'y' : 'ies'}
                      </span>?
                    </p>
                    <div className="mt-3 max-h-32 overflow-y-auto">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Categories to be deleted:</p>
                      <div className="space-y-1">
                        {categories
                          .filter(cat => selectedCategories.has(cat._id))
                          .map(cat => (
                            <div key={cat._id} className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              ></div>
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {cat.name}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={cancelBulkDelete}
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={confirmBulkDelete}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete {selectedCategories.size} Categor{selectedCategories.size === 1 ? 'y' : 'ies'}
                    </Button>
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
