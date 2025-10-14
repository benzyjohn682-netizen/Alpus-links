const express = require('express');
const { body, validationResult } = require('express-validator');
const UserMeta = require('../models/UserMeta');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/user-meta
// @desc    Get current user's meta data
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let userMeta = await UserMeta.findOne({ userId: req.userId });
    
    // Create default meta if doesn't exist
    if (!userMeta) {
      userMeta = new UserMeta({ userId: req.userId });
      await userMeta.save();
    }
    
    res.json({ userMeta });
  } catch (error) {
    console.error('Get user meta error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/user-meta
// @desc    Update current user's meta data
// @access  Private
router.put('/', auth, [
  body('phone').optional().trim().custom((value) => {
    if (value && !/^[\+]?[\d\s\-\(\)]{7,20}$/.test(value)) {
      throw new Error('Please enter a valid phone number');
    }
    return true;
  }),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('website').optional().trim().isURL().withMessage('Please enter a valid website URL'),
  body('socialLinks.twitter').optional().trim(),
  body('socialLinks.linkedin').optional().trim(),
  body('socialLinks.github').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, location, bio, website, socialLinks } = req.body;

    let userMeta = await UserMeta.findOne({ userId: req.userId });
    
    if (!userMeta) {
      userMeta = new UserMeta({ userId: req.userId });
    }

    // Update fields
    if (phone !== undefined) userMeta.phone = phone.trim() || null;
    if (location !== undefined) userMeta.location = location.trim() || null;
    if (bio !== undefined) userMeta.bio = bio.trim() || null;
    if (website !== undefined) userMeta.website = website.trim() || null;
    if (socialLinks) {
      userMeta.socialLinks = { ...userMeta.socialLinks, ...socialLinks };
    }

    await userMeta.save();

    res.json({
      message: 'User meta updated successfully',
      userMeta
    });
  } catch (error) {
    console.error('Update user meta error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
