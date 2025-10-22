const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// Get all categories with pagination and filtering
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      isActive, 
      parentCategory,
      sortBy = 'sortOrder',
      sortOrder = 'asc'
    } = req.query;

    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Active filter
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Parent category filter
    if (parentCategory) {
      if (parentCategory === 'null') {
        query.parentCategory = null;
      } else {
        query.parentCategory = parentCategory;
      }
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const categories = await Category.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('parentCategory', 'name slug')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Category.countDocuments(query);

    res.json({
      success: true,
      data: {
        categories,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// Get all categories (for dropdowns, etc.)
router.get('/all', auth, async (req, res) => {
  try {
    const { isActive = true, parentCategory } = req.query;
    
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (parentCategory !== undefined) {
      if (parentCategory === 'null') {
        query.parentCategory = null;
      } else {
        query.parentCategory = parentCategory;
      }
    }

    const categories = await Category.find(query)
      .populate('parentCategory', 'name slug')
      .sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching all categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// Get category by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('parentCategory', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
});

// Create new category
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, color, icon, parentCategory, sortOrder } = req.body;

    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = new Category({
      name,
      description,
      color,
      icon,
      parentCategory: parentCategory || null,
      sortOrder: sortOrder || 0,
      createdBy: req.user.id
    });

    await category.save();

    // Populate the created category
    await category.populate([
      { path: 'createdBy', select: 'firstName lastName email' },
      { path: 'parentCategory', select: 'name slug' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
});

// Update category
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, color, icon, isActive, parentCategory, sortOrder } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category with same name already exists (excluding current category)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name, _id: { $ne: req.params.id } });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Update fields
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (color !== undefined) category.color = color;
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;
    if (parentCategory !== undefined) category.parentCategory = parentCategory;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    
    category.updatedBy = req.user.id;

    await category.save();

    // Populate the updated category
    await category.populate([
      { path: 'createdBy', select: 'firstName lastName email' },
      { path: 'updatedBy', select: 'firstName lastName email' },
      { path: 'parentCategory', select: 'name slug' }
    ]);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
});

// Delete category
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }


    // Check if category has subcategories
    const subcategories = await Category.find({ parentCategory: req.params.id });
    if (subcategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Please delete subcategories first.'
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
});

// Get category statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const total = await Category.countDocuments();
    const active = await Category.countDocuments({ isActive: true });
    const inactive = await Category.countDocuments({ isActive: false });
    const system = await Category.countDocuments({ isSystem: true });
    const custom = await Category.countDocuments({ isSystem: false });
    const parentCategories = await Category.countDocuments({ parentCategory: null });
    const subcategories = await Category.countDocuments({ parentCategory: { $ne: null } });

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        system,
        custom,
        parentCategories,
        subcategories
      }
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category statistics',
      error: error.message
    });
  }
});

module.exports = router;
