const express = require('express')
const router = express.Router()
const LinkInsertion = require('../models/LinkInsertion')
const auth = require('../middleware/auth')

// GET /api/link-insertions - Get all link insertions for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Build query
    const query = { userId: req.user.id }

    // Add search filter
    if (search) {
      query.$or = [
        { postUrl: { $regex: search, $options: 'i' } },
        { anchorText: { $regex: search, $options: 'i' } },
        { anchorUrl: { $regex: search, $options: 'i' } },
        { currentText: { $regex: search, $options: 'i' } },
        { fixedText: { $regex: search, $options: 'i' } },
        { addingText: { $regex: search, $options: 'i' } }
      ]
    }

    // Add status filter
    if (status && status !== 'all') {
      query.status = status
    }

    // Build sort object
    const sort = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Execute query
    const linkInsertions = await LinkInsertion.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('targetWebsite', 'url title')
      .lean()

    // Get total count for pagination
    const total = await LinkInsertion.countDocuments(query)

    res.json({
      success: true,
      data: {
        linkInsertions,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum
        }
      }
    })
  } catch (error) {
    console.error('Get link insertions error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch link insertions',
      error: error.message
    })
  }
})

// GET /api/link-insertions/:id - Get a specific link insertion
router.get('/:id', auth, async (req, res) => {
  try {
    const linkInsertion = await LinkInsertion.findOne({
      _id: req.params.id,
      userId: req.user.id
    })
    .populate('targetWebsite', 'url title')
    .lean()

    if (!linkInsertion) {
      return res.status(404).json({
        success: false,
        message: 'Link insertion not found'
      })
    }

    res.json({
      success: true,
      data: { linkInsertion }
    })
  } catch (error) {
    console.error('Get link insertion error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch link insertion',
      error: error.message
    })
  }
})

// POST /api/link-insertions - Create a new link insertion
router.post('/', auth, async (req, res) => {
  try {
    const {
      postUrl,
      anchorText,
      anchorUrl,
      currentText,
      fixedText,
      addingText,
      status = 'draft'
    } = req.body

    // Validation
    if (!postUrl || !anchorText || !anchorUrl || !currentText || !fixedText || !addingText) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      })
    }

    // URL validation
    const urlRegex = /^https?:\/\/.+\..+/
    if (!urlRegex.test(postUrl) || !urlRegex.test(anchorUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      })
    }

    const linkInsertion = new LinkInsertion({
      userId: req.user.id,
      postUrl,
      anchorText,
      anchorUrl,
      currentText,
      fixedText,
      addingText,
      status
    })

    await linkInsertion.save()

    res.status(201).json({
      success: true,
      message: 'Link insertion created successfully',
      data: { linkInsertion }
    })
  } catch (error) {
    console.error('Create link insertion error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create link insertion',
      error: error.message
    })
  }
})

// PUT /api/link-insertions/:id - Update a link insertion
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      postUrl,
      anchorText,
      anchorUrl,
      currentText,
      fixedText,
      addingText,
      status
    } = req.body

    // Validation
    if (!postUrl || !anchorText || !anchorUrl || !currentText || !fixedText || !addingText) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      })
    }

    // URL validation
    const urlRegex = /^https?:\/\/.+\..+/
    if (!urlRegex.test(postUrl) || !urlRegex.test(anchorUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      })
    }

    const linkInsertion = await LinkInsertion.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        postUrl,
        anchorText,
        anchorUrl,
        currentText,
        fixedText,
        addingText,
        status
      },
      { new: true, runValidators: true }
    )

    if (!linkInsertion) {
      return res.status(404).json({
        success: false,
        message: 'Link insertion not found'
      })
    }

    res.json({
      success: true,
      message: 'Link insertion updated successfully',
      data: { linkInsertion }
    })
  } catch (error) {
    console.error('Update link insertion error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update link insertion',
      error: error.message
    })
  }
})

// DELETE /api/link-insertions/:id - Delete a link insertion
router.delete('/:id', auth, async (req, res) => {
  try {
    const linkInsertion = await LinkInsertion.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!linkInsertion) {
      return res.status(404).json({
        success: false,
        message: 'Link insertion not found'
      })
    }

    res.json({
      success: true,
      message: 'Link insertion deleted successfully'
    })
  } catch (error) {
    console.error('Delete link insertion error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete link insertion',
      error: error.message
    })
  }
})

// PATCH /api/link-insertions/:id/status - Update status (for admin use)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, adminNotes, rejectionReason } = req.body

    // Check if user is admin
    if (!req.user.role || !['admin', 'super admin'].includes(req.user.role.name)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      })
    }

    const updateData = { status }
    if (adminNotes) updateData.adminNotes = adminNotes
    if (rejectionReason) updateData.rejectionReason = rejectionReason
    if (status === 'approved') updateData.implementedAt = new Date()

    const linkInsertion = await LinkInsertion.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!linkInsertion) {
      return res.status(404).json({
        success: false,
        message: 'Link insertion not found'
      })
    }

    res.json({
      success: true,
      message: 'Link insertion status updated successfully',
      data: { linkInsertion }
    })
  } catch (error) {
    console.error('Update status error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    })
  }
})

module.exports = router
