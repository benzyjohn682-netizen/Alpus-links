const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Role = require('../models/Role');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/roles/public
// @desc    Get all active roles (public endpoint for registration)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true })
      .select('name color')
      .sort({ name: 1 });

    res.json({ roles });
  } catch (error) {
    console.error('Get public roles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/roles
// @desc    Get all roles
// @access  Private
router.get('/', auth, [
  query('active').optional().isBoolean().withMessage('Active must be a boolean'),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Build filter object
    const filter = {};
    
    if (req.query.active !== undefined) {
      filter.isActive = req.query.active === 'true';
    }
    
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const roles = await Role.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .sort({ name: 1 });

    // Get user count for each role
    const rolesWithCount = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.countDocuments({ role: role._id });
        return {
          ...role.toObject(),
          userCount
        };
      })
    );

    res.json({ roles: rolesWithCount });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/roles/:id
// @desc    Get role by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Get user count
    const userCount = await User.countDocuments({ role: role._id });

    res.json({ 
      role: {
        ...role.toObject(),
        userCount
      }
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/roles
// @desc    Create a new role
// @access  Private
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Role name is required'),
  body('permissions').isArray({ min: 1 }).withMessage('At least one permission is required'),
  body('permissions.*').isIn([
    'user_management',
    'role_management',
    'system_settings',
    'data_export',
    'content_moderation',
    'reports',
    'profile_edit',
    'view_content',
    'admin_panel',
    'user_creation',
    'user_deletion',
    'user_edit',
    'role_creation',
    'role_deletion',
    'role_edit'
  ]).withMessage('Invalid permission'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, permissions, color } = req.body;

    // Check if role name already exists
    const existingRole = await Role.findOne({ name: { $regex: new RegExp(name, 'i') } });
    if (existingRole) {
      return res.status(400).json({ message: 'Role with this name already exists' });
    }

    // Create new role
    const role = new Role({
      name,
      permissions,
      color: color || '#3B82F6',
      createdBy: req.userId
    });

    await role.save();

    res.status(201).json({
      message: 'Role created successfully',
      role: {
        id: role._id,
        name: role.name,
        permissions: role.permissions,
        color: role.color,
        isActive: role.isActive,
        createdAt: role.createdAt
      }
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/roles/:id
// @desc    Update role
// @access  Private
router.put('/:id', auth, [
  body('name').optional().trim().notEmpty().withMessage('Role name cannot be empty'),
  body('permissions').optional().isArray({ min: 1 }).withMessage('At least one permission is required'),
  body('permissions.*').optional().isIn([
    'user_management',
    'role_management',
    'system_settings',
    'data_export',
    'content_moderation',
    'reports',
    'profile_edit',
    'view_content',
    'admin_panel',
    'user_creation',
    'user_deletion',
    'user_edit',
    'role_creation',
    'role_deletion',
    'role_edit'
  ]).withMessage('Invalid permission'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const { name, permissions, color, isActive } = req.body;

    // Check if name is being changed and if it's already taken
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ 
        name: { $regex: new RegExp(name, 'i') },
        _id: { $ne: role._id }
      });
      if (existingRole) {
        return res.status(400).json({ message: 'Role with this name already exists' });
      }
    }

    // Update role
    const updateData = { updatedBy: req.userId };
    if (name) updateData.name = name;
    if (permissions) updateData.permissions = permissions;
    if (color) updateData.color = color;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedRole = await Role.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('updatedBy', 'firstName lastName email');

    res.json({
      message: 'Role updated successfully',
      role: {
        id: updatedRole._id,
        name: updatedRole.name,
        permissions: updatedRole.permissions,
        color: updatedRole.color,
        isActive: updatedRole.isActive,
        updatedAt: updatedRole.updatedAt
      }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/roles/:id
// @desc    Delete role
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Allow deletion of system roles (removed restriction)
    // if (role.isSystem) {
    //   return res.status(400).json({ message: 'Cannot delete system roles' });
    // }

    // Check if role is being used by any users
    const userCount = await User.countDocuments({ role: role._id });
    if (userCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete role. It is currently assigned to ${userCount} user(s)` 
      });
    }

    await Role.findByIdAndDelete(req.params.id);

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/roles/:id/users
// @desc    Get users with specific role
// @access  Private
router.get('/:id/users', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ role: role._id })
      .populate('role', 'name permissions')
      .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ role: role._id });

    res.json({
      role: {
        id: role._id,
        name: role.name
      },
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get role users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
