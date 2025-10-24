const express = require('express');
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const LoginSession = require('../models/LoginSession');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users with pagination and filtering
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('role').optional().isMongoId().withMessage('Invalid role ID'),
  query('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Get users with pagination
    const users = await User.find(filter)
      .populate('role', 'name permissions')
      .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Clean up old sessions (older than 24 hours) that are still marked as active
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await LoginSession.updateMany(
      {
        isActive: true,
        loginDate: { $lt: oneDayAgo }
      },
      {
        isActive: false,
        logoutDate: new Date()
      }
    );

    // Check for active sessions for each user
    const userIds = users.map(user => user._id);
    const activeSessions = await LoginSession.find({
      user: { $in: userIds },
      isActive: true
    }).select('user loginDate');

    // Create a map of user ID to active session
    const userActiveSessions = {};
    activeSessions.forEach(session => {
      userActiveSessions[session.user.toString()] = session;
    });

    // Add login state to each user
    const usersWithLoginState = users.map(user => {
      const userObj = user.toObject();
      const activeSession = userActiveSessions[user._id.toString()];
      
      // User is online only if they have an active session
      userObj.isOnline = !!activeSession;
      
      // Set last active login - prefer active session, fallback to lastLogin
      if (activeSession) {
        userObj.lastActiveLogin = activeSession.loginDate;
      } else if (user.lastLogin) {
        userObj.lastActiveLogin = user.lastLogin;
      } else {
        userObj.lastActiveLogin = null;
      }
      
      return userObj;
    });

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    res.json({
      users: usersWithLoginState,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics (admin only)
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role.name?.toLowerCase() !== 'admin' && req.user.role.name?.toLowerCase() !== 'super admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get users by status
    const usersByStatus = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get users by role
    const usersByRole = await User.aggregate([
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'roleInfo'
        }
      },
      {
        $unwind: '$roleInfo'
      },
      {
        $group: {
          _id: '$roleInfo.name',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get users created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get users created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weeklyUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get users created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayUsers = await User.countDocuments({
      createdAt: { $gte: today }
    });

    // Get users who logged in today
    const todayLoggedInUsers = await User.countDocuments({
      lastLogin: { $gte: today }
    });

    // Get users by creation month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const usersByMonth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Convert status array to object
    const statusCounts = {
      active: 0,
      inactive: 0,
      suspended: 0
    };
    
    usersByStatus.forEach(status => {
      statusCounts[status._id] = status.count;
    });

    res.json({
      overview: {
        total: totalUsers,
        active: statusCounts.active,
        inactive: statusCounts.inactive,
        suspended: statusCounts.suspended,
        recent: recentUsers,
        weekly: weeklyUsers,
        today: todayUsers,
        todayLoggedIn: todayLoggedInUsers
      },
      roles: usersByRole,
      monthlyGrowth: usersByMonth
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/online-stats
// @desc    Get currently logged-in users count by role
// @access  Private
router.get('/online-stats', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role.name?.toLowerCase() !== 'admin' && req.user.role.name?.toLowerCase() !== 'super admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Clean up old sessions (older than 24 hours) that are still marked as active
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await LoginSession.updateMany(
      {
        isActive: true,
        loginDate: { $lt: oneDayAgo }
      },
      {
        isActive: false,
        logoutDate: new Date()
      }
    );

    // Get all active sessions with user and role information
    const activeSessions = await LoginSession.aggregate([
      {
        $match: {
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'userInfo.role',
          foreignField: '_id',
          as: 'roleInfo'
        }
      },
      {
        $unwind: '$roleInfo'
      },
      {
        $group: {
          _id: '$roleInfo.name',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total active sessions count
    const totalActiveSessions = await LoginSession.countDocuments({
      isActive: true
    });

    // Format the response
    const roleCounts = {
      advertisers: 0,
      publishers: 0,
      total: totalActiveSessions
    };

    activeSessions.forEach(role => {
      const roleName = role._id.toLowerCase();
      if (roleName.includes('advertiser')) {
        roleCounts.advertisers = role.count;
      } else if (roleName.includes('publisher')) {
        roleCounts.publishers = role.count;
      }
    });

    res.json(roleCounts);
  } catch (error) {
    console.error('Get online stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/online-trends
// @desc    Get historical logged-in user counts by role and time period
// @access  Private
router.get('/online-trends', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role.name?.toLowerCase() !== 'admin' && req.user.role.name?.toLowerCase() !== 'super admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get current online user counts by role
    const currentOnlineStats = await LoginSession.aggregate([
      {
        $match: {
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'userInfo.role',
          foreignField: '_id',
          as: 'roleInfo'
        }
      },
      {
        $unwind: '$roleInfo'
      },
      {
        $group: {
          _id: '$roleInfo.name',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total current online users
    const totalCurrentOnline = await LoginSession.countDocuments({
      isActive: true
    });

    // Format current stats
    const currentStats = {
      advertisers: 0,
      publishers: 0,
      total: totalCurrentOnline
    };

    currentOnlineStats.forEach(role => {
      const roleName = role._id.toLowerCase();
      if (roleName.includes('advertiser')) {
        currentStats.advertisers = role.count;
      } else if (roleName.includes('publisher')) {
        currentStats.publishers = role.count;
      }
    });

    // For historical data, we'll create a simple trend showing current online users
    // In a real implementation, you might want to store snapshots of online users
    const filledData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // For now, we'll show the current online stats for all dates
      // In a production system, you'd want to store historical snapshots
      filledData.push({
        date: dateStr,
        advertisers: currentStats.advertisers,
        publishers: currentStats.publishers,
        total: currentStats.total
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const responseData = {
      data: filledData,
      period,
      totalAdvertisers: currentStats.advertisers,
      totalPublishers: currentStats.publishers,
      totalUsers: currentStats.total
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Get online trends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/login-trends
// @desc    Get user login trends by role and time period
// @access  Private
router.get('/login-trends', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role.name?.toLowerCase() !== 'admin' && req.user.role.name?.toLowerCase() !== 'super admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get login trends from LoginSession model - count unique users per day
    const loginTrends = await LoginSession.aggregate([
      {
        $match: {
          loginDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'userInfo.role',
          foreignField: '_id',
          as: 'roleInfo'
        }
      },
      {
        $unwind: '$roleInfo'
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$loginDate' } },
            user: '$user',
            role: '$roleInfo.name'
          }
        }
      },
      {
        $group: {
          _id: {
            date: '$_id.date',
            role: '$_id.role'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          roles: {
            $push: {
              role: '$_id.role',
              count: '$count'
            }
          }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Format data for chart
    const chartData = loginTrends.map(item => {
      const dataPoint = {
        date: item._id,
        advertisers: 0,
        publishers: 0,
        total: 0
      };

      item.roles.forEach(roleData => {
        if (roleData.role.toLowerCase().includes('advertiser')) {
          dataPoint.advertisers = roleData.count;
        } else if (roleData.role.toLowerCase().includes('publisher')) {
          dataPoint.publishers = roleData.count;
        }
        dataPoint.total += roleData.count;
      });

      return dataPoint;
    });

    // Fill in missing dates with zeros
    const filledData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = chartData.find(item => item.date === dateStr);
      
      filledData.push(existingData || {
        date: dateStr,
        advertisers: 0,
        publishers: 0,
        total: 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const responseData = {
      data: filledData,
      period,
      totalAdvertisers: filledData.reduce((sum, item) => sum + item.advertisers, 0),
      totalPublishers: filledData.reduce((sum, item) => sum + item.publishers, 0),
      totalUsers: filledData.reduce((sum, item) => sum + item.total, 0)
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Get login trends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('role', 'name permissions')
      .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user meta data
    const UserMeta = require('../models/UserMeta');
    const userMetaRecords = await UserMeta.find({ userId: req.params.id });
    
    // Convert array of records to object format
    const userMeta = {};
    userMetaRecords.forEach(record => {
      userMeta[record.meta_property] = record.meta_value;
    });

    // Add meta data to user object
    const userWithMeta = {
      ...user.toObject(),
      meta: userMeta
    };

    console.log(`GET user ${req.params.id} with meta data:`, userMeta);

    res.json(userWithMeta);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/activities
// @desc    Get user activities (login sessions, etc.)
// @access  Private
router.get('/:id/activities', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role.name?.toLowerCase() !== 'admin' && req.user.role.name?.toLowerCase() !== 'super admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userId = req.params.id;
    
    // Get login sessions for the user
    const loginSessions = await LoginSession.find({ user: userId })
      .sort({ loginDate: -1 })
      .limit(20)
      .select('loginDate logoutDate ipAddress userAgent loginMethod isActive');

    // Format activities
    const activities = loginSessions.map(session => ({
      _id: session._id,
      type: 'login',
      description: session.isActive 
        ? `Logged in via ${session.loginMethod}` 
        : `Logged out (session lasted ${Math.round((session.logoutDate - session.loginDate) / (1000 * 60))} minutes)`,
      timestamp: session.loginDate,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent
    }));

    res.json(activities);
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users
// @desc    Create a new user
// @access  Private
router.post('/', auth, [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isMongoId().withMessage('Please select a valid role'),
  body('phone').optional().trim(),
  body('location').optional().trim(),
  body('avatar').optional().isString().withMessage('Avatar must be a base64 data URL or URL string'),
  body('currentPassword').optional().notEmpty().withMessage('Current password is required when changing password'),
  body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, role, phone, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check if role exists
    const roleExists = await Role.findById(role);
    if (!roleExists) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      location
    });

    await user.save();

    // Populate role for response
    await user.populate('role', 'name permissions');

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        location: user.location,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', auth, [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('role').optional().isMongoId().withMessage('Please select a valid role'),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  body('avatar').optional().custom((value) => {
    if (value !== null && value !== undefined && typeof value !== 'string') {
      throw new Error('Avatar must be a string');
    }
    return true;
  }),
  body('phone').optional().trim(),
  body('location').optional().trim(),
  body('currentPassword').optional().isString().withMessage('Current password must be a string'),
  body('newPassword').optional().custom((value) => {
    if (value && value.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { firstName, lastName, email, role, status, phone, location, avatar, currentPassword, newPassword } = req.body;
    
    console.log('Update user request:', {
      userId: req.params.id,
      hasCurrentPassword: !!currentPassword,
      hasNewPassword: !!newPassword,
      fields: { firstName, lastName, email, phone, location },
      requestBody: req.body
    });

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Check if role exists
    if (role) {
      const roleExists = await Role.findById(role);
      if (!roleExists) {
        return res.status(400).json({ message: 'Invalid role selected' });
      }
    }

    // Update user
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Handle password change
    if (newPassword) {
      // Check if the requesting user is a super admin
      const requestingUser = await User.findById(req.user._id).populate('role', 'name permissions');
      const isSuperAdmin = requestingUser?.role?.name === 'super admin' || 
                         requestingUser?.role?.permissions?.includes('user_management');
      
      if (isSuperAdmin) {
        // Super admin can reset passwords without current password
        updateData.password = newPassword;
      } else {
        // Regular users must provide current password
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required to change password' });
        }
        
        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
        
        // Set new password
        updateData.password = newPassword;
      }
    }

    // Apply updates on the document to ensure pre-save hooks (like password hashing) run
    Object.assign(user, updateData)
    await user.save()
    await user.populate('role', 'name permissions')

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/bulk
// @desc    Bulk delete users
// @access  Private
router.delete('/bulk', auth, async (req, res) => {
  try {

    // Check if user is admin
    if (req.user.role.name?.toLowerCase() !== 'admin' && req.user.role.name?.toLowerCase() !== 'super admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs are required' });
    }

    // Validate that all IDs are valid ObjectIds
    const validIds = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    if (validIds.length !== userIds.length) {
      return res.status(400).json({ message: 'Invalid user IDs provided' });
    }

    // Prevent self-deletion
    const filteredIds = validIds.filter(id => id !== req.userId);
    if (filteredIds.length !== validIds.length) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const result = await User.deleteMany({ _id: { $in: filteredIds } });

    res.json({ 
      message: `${result.deletedCount} user(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete users error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/users/bulk/status
// @desc    Bulk update user status
// @access  Private
router.put('/bulk/status', auth, [
  body('userIds').isArray().withMessage('User IDs must be an array'),
  body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role.name?.toLowerCase() !== 'admin' && req.user.role.name?.toLowerCase() !== 'super admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userIds, status } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs are required' });
    }

    // Validate that all IDs are valid ObjectIds
    const validIds = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== userIds.length) {
      return res.status(400).json({ message: 'Invalid user IDs provided' });
    }

    const result = await User.updateMany(
      { _id: { $in: validIds } },
      { status }
    );

    res.json({ 
      message: `${result.modifiedCount} user(s) status updated to ${status}`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update user status error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status
// @access  Private
router.put('/:id/status', auth, [
  body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = req.body.status;
    await user.save();

    res.json({
      message: 'User status updated successfully',
      user: {
        id: user._id,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
