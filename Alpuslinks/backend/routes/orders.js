const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Post = require('../models/Post');
const LinkInsertion = require('../models/LinkInsertion');
const Website = require('../models/Website');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create a new order (place order from cart)
router.post('/', auth, async (req, res) => {
  try {
    const { items } = req.body; // Array of cart items
    const advertiserId = req.user.id;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart items are required'
      });
    }

    const createdOrders = [];

    for (const item of items) {
      const { websiteId, type, price, selectedPostId } = item;

      // Get website details to find publisher
      const website = await Website.findById(websiteId);
      if (!website) {
        return res.status(404).json({
          success: false,
          message: `Website with ID ${websiteId} not found`
        });
      }

      // Create order
      const orderData = {
        advertiserId,
        publisherId: website.publisherId,
        websiteId,
        type,
        price,
        status: 'requested'
      };

      // Add post or link insertion reference based on type
      if (type === 'guestPost' && selectedPostId) {
        orderData.postId = selectedPostId;
      } else if (type === 'linkInsertion' && selectedPostId) {
        orderData.linkInsertionId = selectedPostId;
      }

      const order = new Order(orderData);
      
      // Add initial timeline entry
      order.timeline.push({
        status: 'requested',
        timestamp: new Date(),
        note: 'Order placed',
        updatedBy: advertiserId
      });

      await order.save();
      createdOrders.push(order);
    }

    res.status(201).json({
      success: true,
      message: 'Orders placed successfully',
      data: {
        orders: createdOrders,
        count: createdOrders.length
      }
    });

  } catch (error) {
    console.error('Error creating orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create orders',
      error: error.message
    });
  }
});

// Get orders for publisher (task management)
router.get('/publisher', auth, async (req, res) => {
  try {
    const publisherId = req.user.id;
    const { status, page = 1, limit = 10, search = '' } = req.query;

    const query = { publisherId };
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('advertiserId', 'firstName lastName email company')
      .populate('websiteId', 'domain url')
      .populate('postId', 'title content')
      .populate('linkInsertionId', 'anchorText anchorUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching publisher orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Get orders for advertiser
router.get('/advertiser', auth, async (req, res) => {
  try {
    const advertiserId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { advertiserId };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('publisherId', 'firstName lastName email')
      .populate('websiteId', 'domain url')
      .populate('postId', 'title content')
      .populate('linkInsertionId', 'anchorText anchorUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching advertiser orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Update order status (accept/reject by publisher)
router.patch('/:orderId/status', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note, rejectionReason } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to update this order
    // Publishers can update orders they received
    // Advertisers can only approve/reject orders in 'advertiserApproval' status
    const isPublisher = order.publisherId.toString() === userId;
    const isAdvertiser = order.advertiserId.toString() === userId;
    
    if (!isPublisher && !isAdvertiser) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this order'
      });
    }
    
    // Advertisers can only approve/reject orders in advertiserApproval status
    if (isAdvertiser && order.status !== 'advertiserApproval') {
      return res.status(403).json({
        success: false,
        message: 'You can only approve or reject orders that are pending your approval'
      });
    }
    
    // Advertisers can only transition to completed or rejected
    if (isAdvertiser && !['completed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'You can only approve (complete) or reject orders'
      });
    }

    // Validate status transition based on user role
    const validTransitions = {
      'requested': ['inProgress', 'rejected'],
      'inProgress': ['advertiserApproval', 'rejected'],
      'advertiserApproval': ['completed', 'rejected'],
      'completed': [],
      'rejected': []
    };

    // For advertisers, we already checked they can only approve/reject advertiserApproval orders
    // So we don't need to validate transitions for them
    if (isPublisher && !validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${order.status} to ${status}`
      });
    }

    // Update order status
    await order.updateStatus(status, note, userId);

    // If rejected, add rejection reason
    if (status === 'rejected' && rejectionReason) {
      order.rejectionReason = rejectionReason;
      await order.save();
    }

    // Update related post or link insertion status
    if (order.postId && (status === 'inProgress' || status === 'completed')) {
      await Post.findByIdAndUpdate(order.postId, { 
        status: status === 'inProgress' ? 'inProgress' : 'approved' 
      });
    }

    if (order.linkInsertionId && (status === 'inProgress' || status === 'completed')) {
      await LinkInsertion.findByIdAndUpdate(order.linkInsertionId, { 
        status: status === 'inProgress' ? 'inProgress' : 'approved' 
      });
    }

    // Populate the updated order
    const updatedOrder = await Order.findById(orderId)
      .populate('advertiserId', 'firstName lastName email company')
      .populate('publisherId', 'firstName lastName email')
      .populate('websiteId', 'domain url')
      .populate('postId', 'title content')
      .populate('linkInsertionId', 'anchorText anchorUrl');

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order: updatedOrder }
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

// Get all orders for admin/super admin
router.get('/admin', auth, async (req, res) => {
  try {
    const userRole = req.user.role?.name;
    
    // Check if user is admin or super admin
    if (!['admin', 'super admin'].includes(userRole?.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { 
      status, 
      page = 1, 
      limit = 20, 
      search = '',
      advertiserId,
      publisherId,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by advertiser if provided
    if (advertiserId) {
      query.advertiserId = advertiserId;
    }

    // Filter by publisher if provided
    if (publisherId) {
      query.publisherId = publisherId;
    }

    // Filter by type if provided
    if (type && type !== 'all') {
      query.type = type;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { notes: { $regex: search, $options: 'i' } },
        { rejectionReason: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await Order.find(query)
      .populate('advertiserId', 'firstName lastName email company')
      .populate('publisherId', 'firstName lastName email')
      .populate('websiteId', 'domain url')
      .populate('postId', 'title content')
      .populate('linkInsertionId', 'anchorText anchorUrl')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    // Get order statistics
    const stats = await Order.aggregate([
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }},
      { $group: {
        _id: null,
        stats: { $push: { status: '$_id', count: '$count' } },
        total: { $sum: '$count' }
      }}
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: stats[0] || { stats: [], total: 0 }
      }
    });

  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Update order status by admin
router.patch('/admin/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note, rejectionReason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role?.name;

    // Check if user is admin or super admin
    if (!['admin', 'super admin'].includes(userRole?.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status
    await order.updateStatus(status, note, userId);

    // If rejected, add rejection reason
    if (status === 'rejected' && rejectionReason) {
      order.rejectionReason = rejectionReason;
      await order.save();
    }

    // Update related post or link insertion status
    if (order.postId && (status === 'inProgress' || status === 'completed')) {
      await Post.findByIdAndUpdate(order.postId, { 
        status: status === 'inProgress' ? 'inProgress' : 'approved' 
      });
    }

    if (order.linkInsertionId && (status === 'inProgress' || status === 'completed')) {
      await LinkInsertion.findByIdAndUpdate(order.linkInsertionId, { 
        status: status === 'inProgress' ? 'inProgress' : 'approved' 
      });
    }

    // Populate the updated order
    const updatedOrder = await Order.findById(orderId)
      .populate('advertiserId', 'firstName lastName email company')
      .populate('publisherId', 'firstName lastName email')
      .populate('websiteId', 'domain url')
      .populate('postId', 'title content')
      .populate('linkInsertionId', 'anchorText anchorUrl');

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order: updatedOrder }
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

// Get order details
router.get('/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate('advertiserId', 'firstName lastName email company')
      .populate('publisherId', 'firstName lastName email')
      .populate('websiteId', 'domain url')
      .populate('postId', 'title content')
      .populate('linkInsertionId', 'anchorText anchorUrl');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    if (order.advertiserId._id.toString() !== userId && order.publisherId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: { order }
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

// Get orders by userId (for admin to view all orders for a specific user)
router.get('/admin/by-user/:userId', auth, async (req, res) => {
  try {
    const userRole = req.user.role?.name;
    
    // Check if user is admin or super admin
    if (!['admin', 'super admin'].includes(userRole?.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find orders where user is either advertiser or publisher
    const orders = await Order.find({
      $or: [
        { advertiserId: userId },
        { publisherId: userId }
      ]
    })
      .populate('advertiserId', 'firstName lastName email company')
      .populate('publisherId', 'firstName lastName email')
      .populate('websiteId', 'domain url')
      .populate('postId', 'title content')
      .populate('linkInsertionId', 'anchorText anchorUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments({
      $or: [
        { advertiserId: userId },
        { publisherId: userId }
      ]
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching orders by user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Delete order by admin/super admin
router.delete('/admin/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userRole = req.user.role?.name;

    // Check if user is admin or super admin
    if (!['admin', 'super admin'].includes(userRole?.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Delete the order
    await Order.findByIdAndDelete(orderId);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
});

// Get order statistics
router.get('/stats/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const userRole = req.user.role?.name;

    let matchQuery = {};
    if (userRole === 'publisher') {
      matchQuery = { publisherId: userId };
    } else if (userRole === 'advertiser') {
      matchQuery = { advertiserId: userId };
    }

    const stats = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);

    const formattedStats = {
      requested: 0,
      inProgress: 0,
      advertiserApproval: 0,
      completed: 0,
      rejected: 0,
      totalRevenue: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      if (stat._id === 'completed') {
        formattedStats.totalRevenue = stat.totalRevenue;
      }
    });

    res.json({
      success: true,
      data: { stats: formattedStats }
    });

  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message
    });
  }
});

module.exports = router;
