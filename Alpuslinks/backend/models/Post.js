const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  advertiserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'],
    index: true
  },
  domain: {
    type: String,
    trim: true,
    default: ''
  },
  completeUrl: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  metaTitle: {
    type: String,
    default: ''
  },
  metaDescription: {
    type: String,
    default: ''
  },
  keywords: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  },
  anchorPairs: [{
    text: { type: String, required: true },
    link: { type: String, required: true }
  }],
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft',
    index: true
  },
  postType: {
    type: String,
    enum: ['regular', 'link-insertion', 'writing-gp'],
    default: 'regular',
    index: true
  }
}, { timestamps: true });

postSchema.index({ advertiserId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Post', postSchema);


