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
    const userMetaRecords = await UserMeta.find({ userId: req.userId });
    
    // Convert array of records to object format for easier frontend consumption
    const userMeta = {};
    userMetaRecords.forEach(record => {
      userMeta[record.meta_property] = record.meta_value;
    });
    
    console.log('GET userMeta - Raw records:', userMetaRecords);
    console.log('GET userMeta - Converted object:', userMeta);
    
    res.json({ userMeta });
  } catch (error) {
    console.error('Get user meta error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user-meta/by-user/:userId
// @desc    Get user's meta data by user ID (admin only)
// @access  Private
router.get('/by-user/:userId', auth, async (req, res) => {
  try {
    // Check if user is admin or super admin
    const User = require('../models/User');
    const currentUser = await User.findById(req.userId).populate('role', 'name');
    
    if (!currentUser || (currentUser.role.name !== 'admin' && currentUser.role.name !== 'super admin')) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const userMetaRecords = await UserMeta.find({ userId: req.params.userId });
    
    // Convert array of records to object format for easier frontend consumption
    const userMeta = {};
    userMetaRecords.forEach(record => {
      userMeta[record.meta_property] = record.meta_value;
    });
    
    console.log(`GET userMeta for user ${req.params.userId} - Raw records:`, userMetaRecords);
    console.log(`GET userMeta for user ${req.params.userId} - Converted object:`, userMeta);
    
    res.json({ userMeta });
  } catch (error) {
    console.error('Get user meta by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/user-meta/by-user/:userId
// @desc    Update user's meta data by user ID (admin only)
// @access  Private
router.put('/by-user/:userId', auth, [
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone cannot exceed 20 characters'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('city').optional().trim().isLength({ max: 100 }).withMessage('City cannot exceed 100 characters'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('website').optional().trim().custom((value) => {
    if (value && value.trim() && !/^https?:\/\/.+/.test(value)) {
      throw new Error('Please enter a valid website URL');
    }
    return true;
  }),
  body('country').optional().trim().isLength({ max: 100 }).withMessage('Country cannot exceed 100 characters'),
  body('timezone').optional().trim().isLength({ max: 50 }).withMessage('Timezone cannot exceed 50 characters'),
  body('language').optional().trim().isLength({ max: 50 }).withMessage('Language cannot exceed 50 characters'),
  body('birthday').optional().trim().isLength({ max: 50 }).withMessage('Birthday cannot exceed 50 characters'),
  body('twitter').optional().trim(),
  body('linkedin').optional().trim(),
  body('github').optional().trim()
], async (req, res) => {
  try {
    // Check if user is admin or super admin
    const User = require('../models/User');
    const currentUser = await User.findById(req.userId).populate('role', 'name');
    
    if (!currentUser || (currentUser.role.name !== 'admin' && currentUser.role.name !== 'super admin')) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, location, city, bio, website, country, timezone, language, birthday, twitter, linkedin, github } = req.body;

    console.log(`Received user meta data for user ${req.params.userId}:`, req.body);

    // Define the fields to update
    const fieldsToUpdate = {
      phone,
      location,
      city,
      bio,
      website,
      country,
      timezone,
      language,
      birthday,
      twitter,
      linkedin,
      github
    };

    console.log('Fields to update:', fieldsToUpdate);

    // Process each field
    for (const [property, value] of Object.entries(fieldsToUpdate)) {
      if (value !== undefined && value !== null && value !== '') {
        // Check if record exists
        const existingRecord = await UserMeta.findOne({
          userId: req.params.userId,
          meta_property: property
        });

        if (existingRecord) {
          // Update existing record
          existingRecord.meta_value = value;
          await existingRecord.save();
        } else {
          // Create new record
          const newRecord = new UserMeta({
            userId: req.params.userId,
            meta_property: property,
            meta_value: value
          });
          await newRecord.save();
        }
      } else if (value === '') {
        // Remove record if value is empty string
        await UserMeta.deleteOne({
          userId: req.params.userId,
          meta_property: property
        });
      }
    }

    res.json({ message: 'User meta data updated successfully' });
  } catch (error) {
    console.error('Update user meta by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/user-meta
// @desc    Update current user's meta data
// @access  Private
router.put('/', auth, [
  body('phone').optional().trim().custom((value) => {
    if (value && value.trim() && !/^[\+]?[\d\s\-\(\)]{7,20}$/.test(value)) {
      throw new Error('Please enter a valid phone number');
    }
    return true;
  }),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('city').optional().trim().isLength({ max: 100 }).withMessage('City cannot exceed 100 characters'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('website').optional().trim().custom((value) => {
    if (value && value.trim() && !/^https?:\/\/.+/.test(value)) {
      throw new Error('Please enter a valid website URL');
    }
    return true;
  }),
  body('country').optional().trim().isLength({ max: 100 }).withMessage('Country cannot exceed 100 characters'),
  body('timezone').optional().trim().isLength({ max: 50 }).withMessage('Timezone cannot exceed 50 characters'),
  body('language').optional().trim().isLength({ max: 50 }).withMessage('Language cannot exceed 50 characters'),
  body('birthday').optional().trim().isLength({ max: 50 }).withMessage('Birthday cannot exceed 50 characters'),
  body('twitter').optional().trim(),
  body('linkedin').optional().trim(),
  body('github').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, location, city, bio, website, country, timezone, language, birthday, twitter, linkedin, github } = req.body;

    console.log('Received user meta data:', req.body);

    // Define the fields to update
    const fieldsToUpdate = {
      phone,
      location,
      city,
      bio,
      website,
      country,
      timezone,
      language,
      birthday,
      twitter,
      linkedin,
      github
    };

    console.log('Fields to update:', fieldsToUpdate);

    // Process each field
    for (const [property, value] of Object.entries(fieldsToUpdate)) {
      if (value !== undefined) {
        const trimmedValue = value ? value.trim() : '';
        
        console.log(`Processing field ${property}:`, { value, trimmedValue });
        
        try {
          // First, try to find existing record
          let existingRecord = await UserMeta.findOne({ userId: req.userId, meta_property: property });
          
          if (existingRecord) {
            // Update existing record
            console.log(`Updating existing ${property} with value: "${trimmedValue}"`);
            existingRecord.meta_value = trimmedValue;
            await existingRecord.save();
            console.log(`Successfully updated ${property}:`, existingRecord);
          } else {
            // Create new record
            console.log(`Creating new ${property} with value: "${trimmedValue}"`);
            const newRecord = new UserMeta({
              userId: req.userId,
              meta_property: property,
              meta_value: trimmedValue
            });
            await newRecord.save();
            console.log(`Successfully created ${property}:`, newRecord);
          }
        } catch (fieldError) {
          console.error(`Error processing field ${property}:`, fieldError);
          
          // If it's a duplicate key error, try to delete existing duplicates first
          if (fieldError.code === 11000) {
            console.log(`Duplicate key error for ${property}, cleaning up duplicates...`);
            try {
              // Delete all existing records for this user and property
              await UserMeta.deleteMany({ userId: req.userId, meta_property: property });
              
              // Create new record
              const newRecord = new UserMeta({
                userId: req.userId,
                meta_property: property,
                meta_value: trimmedValue
              });
              await newRecord.save();
              console.log(`Successfully created ${property} after cleanup:`, newRecord);
            } catch (cleanupError) {
              console.error(`Error during cleanup for ${property}:`, cleanupError);
            }
          }
        }
      }
    }

    // Get updated user meta
    const userMetaRecords = await UserMeta.find({ userId: req.userId });
    const userMeta = {};
    userMetaRecords.forEach(record => {
      userMeta[record.meta_property] = record.meta_value;
    });

    console.log('Final userMeta object:', userMeta);

    res.json({
      message: 'User meta updated successfully',
      userMeta
    });
  } catch (error) {
    console.error('Update user meta error:', error);
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

module.exports = router;
