const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Website = require('../models/Website');
const WebsiteMeta = require('../models/WebsiteMeta');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all websites for a publisher
router.get('/publisher/:publisherId', auth, async (req, res) => {
  try {
    const { publisherId } = req.params;
    const { page = 1, limit = 10, status, category, search } = req.query;

    // Check if user is authorized to view these websites
    const userRole = req.user.role.name?.toLowerCase();
    if (userRole !== 'admin' && userRole !== 'super admin' && req.user._id.toString() !== publisherId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = { publisherId };
    
    // Add filters
    if (status) query.status = status;
    if (category) query.categories = { $in: [category] };
    if (search) {
      query.$or = [
        { domain: { $regex: search, $options: 'i' } },
        { url: { $regex: search, $options: 'i' } },
      ];
    }

    const websites = await Website.find(query)
      .populate('publisherId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Website.countDocuments(query);

    // Attach meta data for each website so the UI can display requirements, etc.
    // Fetch all metas in a single query and group them by websiteId
    const websiteIds = websites.map(w => w._id);
    let websitesWithMeta = websites;
    if (websiteIds.length > 0) {
      const metaRecords = await WebsiteMeta.find({ websiteId: { $in: websiteIds } });
      const websiteIdToMeta = {};
      for (const record of metaRecords) {
        const id = record.websiteId.toString();
        if (!websiteIdToMeta[id]) websiteIdToMeta[id] = {};
        websiteIdToMeta[id][record.metaProperty] = record.metaValue;
      }

      websitesWithMeta = websites.map(w => {
        const obj = w.toObject();
        obj.meta = websiteIdToMeta[w._id.toString()] || {};
        return obj;
      });
    }

    res.json({
      websites: websitesWithMeta,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get websites for advertisers to order
router.get('/advertiser/websites', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      country,
      language,
      minDomainAuthority,
      maxDomainAuthority,
      minGuestPostPrice,
      maxGuestPostPrice,
      minLinkInsertionPrice,
      maxLinkInsertionPrice,
      search,
      sortBy = 'domainAuthority',
      sortOrder = 'desc'
    } = req.query;

    const query = { status: 'active' };

    // Check if user is advertiser
    const userRole = req.user.role?.name?.toLowerCase();
    if (userRole !== 'advertiser') {
      return res.status(403).json({ message: 'Access denied. Only advertisers can access this endpoint.' });
    }

    // Add filters
    if (category) query.category = category;
    if (country) query.country = { $regex: country, $options: 'i' };
    if (language) query.language = language;
    
    // Parse numeric filters
    const minDA = Number(minDomainAuthority);
    const maxDA = Number(maxDomainAuthority);
    const minGP = Number(minGuestPostPrice);
    const maxGP = Number(maxGuestPostPrice);
    const minLI = Number(minLinkInsertionPrice);
    const maxLI = Number(maxLinkInsertionPrice);

    // Only apply range filters when user actually narrows them from defaults
    // Domain Authority defaults: 0 - 100
    const hasMinDA = Number.isFinite(minDA) && minDA > 0;
    const hasMaxDA = Number.isFinite(maxDA) && maxDA < 100;
    if (hasMinDA || hasMaxDA) {
      query.domainAuthority = {};
      if (hasMinDA) query.domainAuthority.$gte = minDA;
      if (hasMaxDA) query.domainAuthority.$lte = maxDA;
    }

    // Guest post price defaults: 0 - 10000
    const hasMinGP = Number.isFinite(minGP) && minGP > 0;
    const hasMaxGP = Number.isFinite(maxGP) && maxGP < 10000;
    if (hasMinGP || hasMaxGP) {
      query['pricing.guestPost'] = {};
      if (hasMinGP) query['pricing.guestPost'].$gte = minGP;
      if (hasMaxGP) query['pricing.guestPost'].$lte = maxGP;
    }

    // Link insertion price defaults: 0 - 10000
    const hasMinLI = Number.isFinite(minLI) && minLI > 0;
    const hasMaxLI = Number.isFinite(maxLI) && maxLI < 10000;
    if (hasMinLI || hasMaxLI) {
      query['pricing.linkInsertion'] = {};
      if (hasMinLI) query['pricing.linkInsertion'].$gte = minLI;
      if (hasMaxLI) query['pricing.linkInsertion'].$lte = maxLI;
    }

    if (search) {
      query.$or = [
        { domain: { $regex: search, $options: 'i' } },
        { url: { $regex: search, $options: 'i' } },
,
        { domain: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    if (sortBy === 'domainAuthority') {
      sort.domainAuthority = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'monthlyTraffic') {
      sort.monthlyTraffic = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'guestPostPrice') {
      sort['pricing.guestPost'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'linkInsertionPrice') {
      sort['pricing.linkInsertion'] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const websites = await Website.find(query)
      .populate('publisherId', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Website.countDocuments(query);

    // Get unique values for filters
    const categories = await Website.distinct('categories', { status: 'active' });
    const countries = await Website.distinct('country', { status: 'active' });
    const languages = await Website.distinct('language', { status: 'active' });

    // Attach meta for advertiser listing so UI can show requirements
    const websiteIds = websites.map(w => w._id);
    let websitesWithMeta = websites;
    if (websiteIds.length > 0) {
      const metaRecords = await WebsiteMeta.find({ websiteId: { $in: websiteIds } });
      const websiteIdToMeta = {};
      for (const record of metaRecords) {
        const id = record.websiteId.toString();
        if (!websiteIdToMeta[id]) websiteIdToMeta[id] = {};
        websiteIdToMeta[id][record.metaProperty] = record.metaValue;
      }

      websitesWithMeta = websites.map(w => {
        const obj = w.toObject();
        obj.meta = websiteIdToMeta[w._id.toString()] || {};
        return obj;
      });
    }

    res.json({
      websites: websitesWithMeta,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      filters: { categories, countries, languages }
    });
  } catch (error) {
    console.error('Error fetching advertiser websites:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all websites (admin only)
router.get('/admin/all', auth, async (req, res) => {
  try {
    // Debug logging
    
    // Check if user is admin
    const userRole = req.user.role?.name?.toLowerCase();
    
    if (userRole !== 'admin' && userRole !== 'super admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10, status, category, search, publisherId } = req.query;

    const query = {};
    
    // Add filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (publisherId) query.publisherId = publisherId;
    if (search) {
      query.$or = [
        { domain: { $regex: search, $options: 'i' } },
        { url: { $regex: search, $options: 'i' } },
      ];
    }

    const websites = await Website.find(query)
      .populate('publisherId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Log any websites with null publisherId for debugging
    const orphanedWebsites = websites.filter(website => !website.publisherId);

    const total = await Website.countDocuments(query);

    res.json({
      websites,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk update website status (admin only)
router.patch('/bulk/status', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role.name?.toLowerCase() !== 'admin' && req.user.role.name?.toLowerCase() !== 'super admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { websiteIds, status } = req.body;
    const validStatuses = ['active', 'inactive', 'pending', 'rejected'];

    if (!websiteIds || !Array.isArray(websiteIds) || websiteIds.length === 0) {
      return res.status(400).json({ message: 'Website IDs are required' });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Validate that all IDs are valid ObjectIds
    const validIds = websiteIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== websiteIds.length) {
      return res.status(400).json({ message: 'Invalid website IDs provided' });
    }

    const result = await Website.updateMany(
      { _id: { $in: validIds } },
      { status }
    );

    res.json({ 
      message: `${result.modifiedCount} website(s) status updated to ${status}`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk status update error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single website
router.get('/:id', auth, async (req, res) => {
  try {
    const website = await Website.findById(req.params.id)
      .populate('publisherId', 'firstName lastName email');

    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }

    // Check if user is authorized to view this website
    if (req.user.role.name?.toLowerCase() !== 'admin' && req.user.role.name?.toLowerCase() !== 'super admin' && website.publisherId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get website meta data using new structure
    const meta = await WebsiteMeta.getWebsiteMeta(req.params.id);
    
    const response = {
      ...website.toObject(),
      meta: meta
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new website
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received website data:', req.body);
    
    const websiteData = {
      ...req.body,
      publisherId: req.user._id
    };
    
    console.log('Processed website data:', websiteData);

    // Normalize URL by adding https:// if missing
    if (websiteData.url && !websiteData.url.match(/^https?:\/\//)) {
      websiteData.url = 'https://' + websiteData.url;
    }

    // Extract domain from URL for duplicate checking
    let domain = null;
    if (websiteData.url) {
      try {
        const urlObj = new URL(websiteData.url);
        domain = urlObj.hostname.replace('www.', '');
      } catch (error) {
        return res.status(400).json({ message: 'Invalid URL format' });
      }
    }

    // Check for existing websites with the same domain
    if (domain) {
      const existingWebsite = await Website.findOne({ domain: domain });
      
      if (existingWebsite) {
        // Check if the website is archived (inactive or rejected)
        if (existingWebsite.status === 'inactive' || existingWebsite.status === 'rejected') {
          return res.status(400).json({ 
            message: 'This website has been archived and cannot be re-registered. Please contact support if you believe this is an error.' 
          });
        }
        
        // Check if the website is registered by another publisher
        if (existingWebsite.publisherId.toString() !== req.user._id.toString()) {
          return res.status(400).json({ 
            message: 'This website is already registered by another publisher. Each website can only be registered once.' 
          });
        }
        
        // If it's the same publisher, allow update instead of creating duplicate
        if (existingWebsite.publisherId.toString() === req.user._id.toString()) {
          return res.status(400).json({ 
            message: 'You have already registered this website. Please use the edit function to update it.' 
          });
        }
      }
    }

    // Set the domain field
    websiteData.domain = domain;
    
    const website = new Website(websiteData);
    
    // Handle ownership verification data if provided
    if (websiteData.ownershipVerification) {
      const { ownershipVerification } = websiteData;
      
      // Set ownership verification fields
      website.ownershipVerification.userRole = ownershipVerification.role || 'owner';
      website.ownershipVerification.verificationMethod = ownershipVerification.method || null;
      website.ownershipVerification.status = ownershipVerification.verified ? 'verified' : 'pending';
      website.ownershipVerification.isVerified = ownershipVerification.verified || false;
      
      if (ownershipVerification.verified) {
        website.ownershipVerification.verifiedAt = new Date();
      }
      
      // Store verification details based on method
      if (ownershipVerification.method && ownershipVerification.method !== 'skip') {
        website.ownershipVerification.verificationDetails = {
          metaTagContent: ownershipVerification.metaTag || null,
          fileName: ownershipVerification.fileName || null,
          dnsRecord: ownershipVerification.dnsRecord || null
        };
      }
    }
    
    await website.save();
    console.log('Website saved successfully:', website._id);

    // Create WebsiteMeta records using key-value structure
    const metaData = {
      ...websiteData.metrics,
      ...websiteData.requirements,
      sponsored: websiteData.sponsored || false,
      ...websiteData.contactInfo,
      ...websiteData.socialMedia,
      notes: websiteData.notes
    };

    // Remove undefined values
    const cleanMetaData = Object.fromEntries(
      Object.entries(metaData).filter(([_, value]) => value !== undefined)
    );

    await WebsiteMeta.setWebsiteMeta(website._id, cleanMetaData);
    console.log('WebsiteMeta saved successfully');

    const populatedWebsite = await Website.findById(website._id)
      .populate('publisherId', 'firstName lastName email');

    // Get meta data and attach to response
    const meta = await WebsiteMeta.getWebsiteMeta(website._id);
    const response = populatedWebsite.toObject();
    response.meta = meta;

    res.status(201).json(response);
  } catch (error) {
    console.error('Website creation error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', errors);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate entry. This website domain already exists.' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update website
router.put('/:id', auth, async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);

    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }

    // Check if user is authorized to update this website
    if (req.user.role.name?.toLowerCase() !== 'admin' && req.user.role.name?.toLowerCase() !== 'super admin' && website.publisherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove publisherId from update data to prevent unauthorized changes
    const { publisherId, metrics, requirements, sponsored, contactInfo, socialMedia, notes, ...websiteUpdateData } = req.body;

    // Update Website record
    const updatedWebsite = await Website.findByIdAndUpdate(
      req.params.id,
      websiteUpdateData,
      { new: true, runValidators: true }
    ).populate('publisherId', 'firstName lastName email');

    // Update WebsiteMeta records if meta data is provided
    if (metrics || requirements || sponsored !== undefined || contactInfo || socialMedia || notes !== undefined) {
      const metaUpdateData = {
        ...metrics,
        ...requirements,
        ...contactInfo,
        ...socialMedia
      };
      
      if (sponsored !== undefined) metaUpdateData.sponsored = sponsored;
      if (notes !== undefined) metaUpdateData.notes = notes;

      // Remove undefined values
      const cleanMetaData = Object.fromEntries(
        Object.entries(metaUpdateData).filter(([_, value]) => value !== undefined)
      );

      await WebsiteMeta.setWebsiteMeta(req.params.id, cleanMetaData);
    }

    // Always attach latest meta in the response so the client can render immediately
    const meta = await WebsiteMeta.getWebsiteMeta(req.params.id);
    const responseWithMeta = updatedWebsite.toObject();
    responseWithMeta.meta = meta;

    res.json(responseWithMeta);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate entry. This website domain already exists.' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Delete website
router.delete('/:id', auth, async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);

    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }

    // Check if user is authorized to delete this website
    if (req.user.role.name?.toLowerCase() !== 'admin' && req.user.role.name?.toLowerCase() !== 'super admin' && website.publisherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete both Website and WebsiteMeta records
    await Website.findByIdAndDelete(req.params.id);
    await WebsiteMeta.deleteWebsiteMeta(req.params.id);
    
    res.json({ message: 'Website deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk delete websites (admin only)
router.delete('/bulk', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role.name?.toLowerCase() !== 'admin' && req.user.role.name?.toLowerCase() !== 'super admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { websiteIds } = req.body;

    if (!websiteIds || !Array.isArray(websiteIds) || websiteIds.length === 0) {
      return res.status(400).json({ message: 'Website IDs are required' });
    }

    // Validate that all IDs are valid ObjectIds
    const validIds = websiteIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== websiteIds.length) {
      return res.status(400).json({ message: 'Invalid website IDs provided' });
    }

    const result = await Website.deleteMany({ _id: { $in: validIds } });
    await WebsiteMeta.deleteMany({ websiteId: { $in: validIds } });

    res.json({ 
      message: `${result.deletedCount} website(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update website status (admin only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role.name?.toLowerCase() !== 'admin' && req.user.role.name?.toLowerCase() !== 'super admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status } = req.body;
    const validStatuses = ['active', 'inactive', 'pending', 'rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const website = await Website.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('publisherId', 'firstName lastName email');

    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }

    res.json(website);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Check if website URL is already registered
router.post('/check-url', auth, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    // Normalize URL by adding https:// if missing
    let normalizedUrl = url;
    if (url && !url.match(/^https?:\/\//)) {
      normalizedUrl = 'https://' + url;
    }

    // Extract domain from URL
    let domain = null;
    try {
      const urlObj = new URL(normalizedUrl);
      domain = urlObj.hostname.replace('www.', '');
    } catch (error) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

    // Check for existing websites with the same domain
    const existingWebsite = await Website.findOne({ domain: domain });
    
    if (existingWebsite) {
      // Check if the website is archived (inactive or rejected)
      if (existingWebsite.status === 'inactive' || existingWebsite.status === 'rejected') {
        return res.json({ 
          isRegistered: true,
          isArchived: true,
          message: 'This website has been archived and cannot be re-registered. Please contact support if you believe this is an error.',
          existingWebsite: {
            id: existingWebsite._id,
            domain: existingWebsite.domain || new URL(existingWebsite.url).hostname.replace('www.', ''),
            status: existingWebsite.status,
            publisherId: existingWebsite.publisherId
          }
        });
      }
      
      // Check if the website is registered by another publisher
      if (existingWebsite.publisherId.toString() !== req.user._id.toString()) {
        return res.json({ 
          isRegistered: true,
          isOtherPublisher: true,
          message: 'This website is already registered by another publisher. Each website can only be registered once.',
          existingWebsite: {
            id: existingWebsite._id,
            domain: existingWebsite.domain || new URL(existingWebsite.url).hostname.replace('www.', ''),
            status: existingWebsite.status,
            publisherId: existingWebsite.publisherId
          }
        });
      }
      
      // If it's the same publisher, suggest editing instead
      if (existingWebsite.publisherId.toString() === req.user._id.toString()) {
        return res.json({ 
          isRegistered: true,
          isOwnWebsite: true,
          message: 'You have already registered this website. Please use the edit function to update it.',
          existingWebsite: {
            id: existingWebsite._id,
            domain: existingWebsite.domain || new URL(existingWebsite.url).hostname.replace('www.', ''),
            status: existingWebsite.status,
            publisherId: existingWebsite.publisherId
          }
        });
      }
    }

    // Website is not registered
    res.json({ 
      isRegistered: false,
      message: 'This website URL is available for registration.' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get website statistics
router.get('/stats/:publisherId', auth, async (req, res) => {
  try {
    const { publisherId } = req.params;

    // Check if user is authorized to view these stats
    if (req.user.role.name?.toLowerCase() !== 'admin' && req.user.role.name?.toLowerCase() !== 'super admin' && req.user._id.toString() !== publisherId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await Website.aggregate([
      { $match: { publisherId: new mongoose.Types.ObjectId(publisherId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          avgDomainAuthority: { $avg: '$domainAuthority' },
          avgMonthlyTraffic: { $avg: '$monthlyTraffic' }
        }
      }
    ]);

    const categoryStats = await Website.aggregate([
      { $match: { publisherId: new mongoose.Types.ObjectId(publisherId) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      overview: stats[0] || {
        total: 0,
        active: 0,
        pending: 0,
        inactive: 0,
        rejected: 0,
        avgDomainAuthority: 0,
        avgMonthlyTraffic: 0
      },
      categories: categoryStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all websites statistics (admin only)
router.get('/admin/stats', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role.name?.toLowerCase() !== 'admin' && req.user.role.name?.toLowerCase() !== 'super admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await Website.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          avgDomainAuthority: { $avg: '$domainAuthority' },
          avgMonthlyTraffic: { $avg: '$monthlyTraffic' }
        }
      }
    ]);

    const categoryStats = await Website.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const publisherStats = await Website.aggregate([
      {
        $group: {
          _id: '$publisherId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'publisher'
        }
      },
      {
        $unwind: '$publisher'
      },
      {
        $project: {
          publisherName: { $concat: ['$publisher.firstName', ' ', '$publisher.lastName'] },
          publisherEmail: '$publisher.email',
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      overview: stats[0] || {
        total: 0,
        active: 0,
        pending: 0,
        inactive: 0,
        rejected: 0,
        avgDomainAuthority: 0,
        avgMonthlyTraffic: 0
      },
      categories: categoryStats,
      publishers: publisherStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify website ownership
router.post('/verify-ownership', auth, async (req, res) => {
  try {
    const { method, url, metaTag, dnsRecord } = req.body;
    const file = req.file; // If file upload is used
    
    // Generate a verification code
    const verificationCode = `alpus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let verified = false;
    let message = '';
    let details = {};
    
    try {
      switch (method) {
        case 'meta':
          if (!metaTag) {
            return res.status(400).json({ message: 'Meta tag content is required' });
          }
          
          // Check if meta tag exists on the website
          const metaResponse = await fetch(url);
          const metaHtml = await metaResponse.text();
          
          const metaTagPattern = new RegExp(`<meta\\s+name=["']alpus-verification["']\\s+content=["']${metaTag}["']`, 'i');
          verified = metaTagPattern.test(metaHtml);
          
          if (verified) {
            message = 'Meta tag verification successful';
            details = { metaTagContent: metaTag };
          } else {
            message = 'Meta tag not found on website. Please ensure the tag is added to the <head> section.';
          }
          break;
          
        case 'file':
          if (!file) {
            return res.status(400).json({ message: 'Verification file is required' });
          }
          
          // Check if file exists on the website
          const fileUrl = `${url.replace(/\/$/, '')}/alpus-verification.txt`;
          const fileResponse = await fetch(fileUrl);
          
          if (fileResponse.ok) {
            const fileContent = await fileResponse.text();
            verified = fileContent.trim() === verificationCode;
            
            if (verified) {
              message = 'File verification successful';
              details = { fileName: file.originalname };
            } else {
              message = 'File content does not match. Please ensure the file contains the correct verification code.';
            }
          } else {
            message = 'Verification file not found on website. Please upload the file to your website root directory.';
          }
          break;
          
        case 'dns':
          if (!dnsRecord) {
            return res.status(400).json({ message: 'DNS record is required' });
          }
          
          // Check DNS record (simplified - in production, use a proper DNS lookup service)
          const dnsUrl = `https://dns.google/resolve?name=${new URL(url).hostname}&type=TXT`;
          const dnsResponse = await fetch(dnsUrl);
          const dnsData = await dnsResponse.json();
          
          if (dnsData.Answer) {
            const txtRecords = dnsData.Answer.filter(record => record.type === 16);
            const expectedRecord = `alpus-verification=${dnsRecord}`;
            verified = txtRecords.some(record => record.data.includes(expectedRecord));
            
            if (verified) {
              message = 'DNS verification successful';
              details = { dnsRecord };
            } else {
              message = 'DNS record not found or does not match. Please ensure the TXT record is correctly set.';
            }
          } else {
            message = 'No DNS records found. Please ensure the TXT record is properly configured.';
          }
          break;
          
        case 'skip':
          verified = true;
          message = 'Ownership verification skipped for contributor';
          break;
          
        default:
          return res.status(400).json({ message: 'Invalid verification method' });
      }
    } catch (fetchError) {
      console.error('Verification error:', fetchError);
      return res.status(500).json({ 
        message: 'Failed to verify ownership. Please check your website is accessible and try again.',
        error: fetchError.message 
      });
    }
    
    res.json({
      verified,
      message,
      verificationCode,
      details,
      method
    });
    
  } catch (error) {
    console.error('Ownership verification error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
