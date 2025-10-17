const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Post = require('../models/Post');

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
    const { title, completeUrl, description, metaTitle, metaDescription, keywords, content, anchorPairs } = req.body;

    // Extract slug from complete URL for uniqueness check
    let slug = 'untitled';
    try {
      const urlObj = new URL(completeUrl.startsWith('http') ? completeUrl : `https://${completeUrl}`);
      slug = urlObj.pathname.replace(/^\//, '') || 'untitled';
    } catch (e) {
      // If URL parsing fails, use the completeUrl as slug
      slug = completeUrl.replace(/^https?:\/\//, '').replace(/^[^\/]+\//, '') || 'untitled';
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
      status: 'draft'
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
  body('content').trim().notEmpty().withMessage('Content is required'),
], async (req, res) => {
  try {
    console.log('Submit request body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const advertiserId = req.user._id;
    const { title, completeUrl, description, metaTitle, metaDescription, keywords, content, anchorPairs } = req.body;

    // Extract slug from complete URL for uniqueness check
    let slug = 'untitled';
    try {
      const urlObj = new URL(completeUrl.startsWith('http') ? completeUrl : `https://${completeUrl}`);
      slug = urlObj.pathname.replace(/^\//, '') || 'untitled';
    } catch (e) {
      // If URL parsing fails, use the completeUrl as slug
      slug = completeUrl.replace(/^https?:\/\//, '').replace(/^[^\/]+\//, '') || 'untitled';
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
    const { title, completeUrl, description, metaTitle, metaDescription, keywords, content, anchorPairs } = req.body;

    const post = await Post.findOne({ _id: id, advertiserId });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Extract slug from complete URL for uniqueness check
    let slug = 'untitled';
    try {
      const urlObj = new URL(completeUrl.startsWith('http') ? completeUrl : `https://${completeUrl}`);
      slug = urlObj.pathname.replace(/^\//, '') || 'untitled';
    } catch (e) {
      // If URL parsing fails, use the completeUrl as slug
      slug = completeUrl.replace(/^https?:\/\//, '').replace(/^[^\/]+\//, '') || 'untitled';
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


