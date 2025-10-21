const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const domainVerificationService = require('../services/domainVerificationService');

// Create or update draft
router.post('/draft', auth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('completeUrl').trim().notEmpty().withMessage('Complete URL is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const advertiserId = req.user._id;
    const { title, completeUrl, description, metaTitle, metaDescription, keywords, content, anchorPairs, postType } = req.body;

    // Extract slug from complete URL for uniqueness check
    let slug = 'untitled';
    let domain = null;
    try {
      const urlObj = new URL(completeUrl.startsWith('http') ? completeUrl : `https://${completeUrl}`);
      const rawSlug = urlObj.pathname.replace(/^\//, '') || 'untitled';
      // Sanitize slug to only contain lowercase letters, numbers, and hyphens
      slug = rawSlug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')  // Replace invalid chars with hyphens
        .replace(/-+/g, '-')           // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, '')      // Remove leading/trailing hyphens
        || 'untitled';
      domain = urlObj.hostname.replace('www.', '');
    } catch (e) {
      // If URL parsing fails, use the completeUrl as slug
      const rawSlug = completeUrl.replace(/^https?:\/\//, '').replace(/^[^\/]+\//, '') || 'untitled';
      slug = rawSlug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'untitled';
    }

    // Verify domain exists and is reachable (skip for link insertions)
    if (domain && title !== 'Link Insertion Request') {
      console.log(`Verifying domain for post: ${domain}`);
      try {
        const verificationResult = await domainVerificationService.verifyDomain(domain);
        
        if (!verificationResult.isValid) {
          return res.status(400).json({ 
            message: `Domain verification failed: ${verificationResult.error}`,
            details: verificationResult.details
          });
        }
        
        console.log(`Domain ${domain} verified successfully for post`);
      } catch (verificationError) {
        console.error('Domain verification error for post:', verificationError);
        return res.status(400).json({ 
          message: 'Domain verification failed. Please ensure the domain exists and is accessible.',
          error: verificationError.message
        });
      }
    }

    const existing = await Post.findOne({ advertiserId, slug });
    if (existing) {
      existing.title = title;
      existing.completeUrl = completeUrl;
      existing.description = description || '';
      existing.metaTitle = metaTitle || '';
      existing.metaDescription = metaDescription || '';
      existing.keywords = keywords || '';
      existing.content = content || '';
      existing.anchorPairs = Array.isArray(anchorPairs) ? anchorPairs : [];
      existing.status = 'draft';
      existing.postType = postType || 'regular';
      await existing.save();
      return res.json({ message: 'Draft updated', post: existing });
    }

    const post = new Post({
      advertiserId,
      title,
      slug,
      completeUrl: completeUrl,
      description: description || '',
      metaTitle: metaTitle || '',
      metaDescription: metaDescription || '',
      keywords: keywords || '',
      content: content || '',
      anchorPairs: Array.isArray(anchorPairs) ? anchorPairs : [],
      status: 'draft',
      postType: postType || 'regular'
    });
    await post.save();
    res.status(201).json({ message: 'Draft created', post });
  } catch (error) {
    console.error('Create draft error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit for moderation
router.post('/submit', auth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('completeUrl').trim().notEmpty().withMessage('Complete URL is required'),
  body('content').optional().trim(),
], async (req, res) => {
  try {
    console.log('Submit request body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const advertiserId = req.user._id;
    const { title, completeUrl, description, metaTitle, metaDescription, keywords, content, anchorPairs, postType } = req.body;

    // Custom validation: content is required for non-link-insertion posts
    if (title !== 'Link Insertion Request' && (!content || content.trim() === '')) {
      return res.status(400).json({ 
        errors: [{ msg: 'Content is required for this type of post', param: 'content' }] 
      });
    }

    // Extract slug and domain from complete URL for uniqueness check
    let slug = 'untitled';
    let domain = null;
    try {
      const urlObj = new URL(completeUrl.startsWith('http') ? completeUrl : `https://${completeUrl}`);
      const rawSlug = urlObj.pathname.replace(/^\//, '') || 'untitled';
      // Sanitize slug to only contain lowercase letters, numbers, and hyphens
      slug = rawSlug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')  // Replace invalid chars with hyphens
        .replace(/-+/g, '-')           // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, '')      // Remove leading/trailing hyphens
        || 'untitled';
      domain = urlObj.hostname.replace('www.', '');
    } catch (e) {
      // If URL parsing fails, use the completeUrl as slug
      const rawSlug = completeUrl.replace(/^https?:\/\//, '').replace(/^[^\/]+\//, '') || 'untitled';
      slug = rawSlug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'untitled';
    }

    // Skip domain verification for link insertions
    if (title !== 'Link Insertion Request' && domain) {
      console.log(`Verifying domain for submission: ${domain}`);
      try {
        const verificationResult = await domainVerificationService.verifyDomain(domain);
        
        if (!verificationResult.isValid) {
          return res.status(400).json({ 
            message: `Domain verification failed: ${verificationResult.error}`,
            details: verificationResult.details
          });
        }
        
        console.log(`Domain ${domain} verified successfully for submission`);
      } catch (verificationError) {
        console.error('Domain verification error for submission:', verificationError);
        return res.status(400).json({ 
          message: 'Domain verification failed. Please ensure the domain exists and is accessible.',
          error: verificationError.message
        });
      }
    }

    let post = await Post.findOne({ advertiserId, slug });
    if (!post) {
      post = new Post({ advertiserId, slug });
    }

    post.title = title;
    post.completeUrl = completeUrl;
    post.description = description || '';
    post.metaTitle = metaTitle || '';
    post.metaDescription = metaDescription || '';
    post.keywords = keywords || '';
    post.content = content || '';
    post.anchorPairs = Array.isArray(anchorPairs) ? anchorPairs : [];
    post.status = 'pending';
    post.postType = postType || 'regular';
    await post.save();

    res.status(200).json({ message: 'Post submitted for moderation', post });
  } catch (error) {
    console.error('Submit post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get advertiser posts
router.get('/', auth, async (req, res) => {
  try {
    const advertiserId = req.user._id;
    const posts = await Post.find({ advertiserId }).sort({ createdAt: -1 });
    res.json({ posts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single post
router.get('/:id', auth, async (req, res) => {
  try {
    const advertiserId = req.user._id;
    const { id } = req.params;
    const post = await Post.findOne({ _id: id, advertiserId });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update post
router.put('/:id', auth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('completeUrl').trim().notEmpty().withMessage('Complete URL is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const advertiserId = req.user._id;
    const { title, completeUrl, description, metaTitle, metaDescription, keywords, content, anchorPairs, postType } = req.body;

    const post = await Post.findOne({ _id: id, advertiserId });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Extract slug from complete URL for uniqueness check
    let slug = 'untitled';
    try {
      const urlObj = new URL(completeUrl.startsWith('http') ? completeUrl : `https://${completeUrl}`);
      const rawSlug = urlObj.pathname.replace(/^\//, '') || 'untitled';
      // Sanitize slug to only contain lowercase letters, numbers, and hyphens
      slug = rawSlug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')  // Replace invalid chars with hyphens
        .replace(/-+/g, '-')           // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, '')      // Remove leading/trailing hyphens
        || 'untitled';
    } catch (e) {
      // If URL parsing fails, use the completeUrl as slug
      const rawSlug = completeUrl.replace(/^https?:\/\//, '').replace(/^[^\/]+\//, '') || 'untitled';
      slug = rawSlug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'untitled';
    }

    post.title = title;
    post.slug = slug;
    post.completeUrl = completeUrl;
    post.description = description || '';
    post.metaTitle = metaTitle || '';
    post.metaDescription = metaDescription || '';
    post.keywords = keywords || '';
    post.content = content || '';
    post.anchorPairs = Array.isArray(anchorPairs) ? anchorPairs : [];
    post.postType = postType || 'regular';
    
    await post.save();
    res.json({ message: 'Post updated', post });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const advertiserId = req.user._id;
    
    const post = await Post.findOne({ _id: id, advertiserId });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await Post.findByIdAndDelete(id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


