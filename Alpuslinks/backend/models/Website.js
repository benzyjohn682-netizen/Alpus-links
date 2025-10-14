const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
  publisherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  domain: {
    type: String,
    required: [true, 'Domain is required'],
    trim: true,
    unique: true
  },
  url: {
    type: String,
    required: [true, 'Website URL is required'],
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
  },
  categories: [{
    type: String,
    enum: [
      'technology',
      'business',
      'health',
      'finance',
      'education',
      'lifestyle',
      'travel',
      'food',
      'sports',
      'entertainment',
      'news',
      'fashion',
      'beauty',
      'parenting',
      'home',
      'automotive',
      'gaming',
      'photography',
      'music',
      'art',
      'other'
    ]
  }],
  pricing: {
    guestPost: {
      type: Number,
      min: [0, 'Guest post price cannot be negative']
    },
    linkInsertion: {
      type: Number,
      min: [0, 'Link insertion price cannot be negative']
    },
    writingGuestPost: {
      type: Number,
      min: [0, 'Writing + guest post price cannot be negative']
    }
  },
  turnaroundTimeDays: {
    type: Number,
    min: [1, 'Turnaround time must be at least 1 day'],
    default: 7
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    maxlength: [50, 'Country name cannot exceed 50 characters']
  },
  language: {
    type: String,
    required: [true, 'Language is required'],
    default: 'en',
    enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'other']
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'rejected'],
    default: 'pending'
  },
  ownershipVerification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verificationMethod: {
      type: String,
      enum: ['meta', 'file', 'dns', 'skip'],
      default: null
    },
    userRole: {
      type: String,
      enum: ['owner', 'contributor'],
      default: 'owner'
    },
    verificationCode: {
      type: String,
      trim: true,
      default: null
    },
    verificationDetails: {
      metaTagContent: { type: String, trim: true },
      fileName: { type: String, trim: true },
      dnsRecord: { type: String, trim: true }
    },
    lastAttempted: {
      type: Date,
      default: null
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'failed', 'skipped'],
      default: 'pending'
    },
    failureReason: {
      type: String,
      trim: true,
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full website info
websiteSchema.virtual('fullInfo').get(function() {
  return `${this.domain}`;
});

// Virtual for ownership verification status
websiteSchema.virtual('ownershipStatus').get(function() {
  if (!this.ownershipVerification) return 'not_attempted';
  
  if (this.ownershipVerification.userRole === 'contributor') {
    return 'contributor_skipped';
  }
  
  if (this.ownershipVerification.isVerified) {
    return 'verified';
  }
  
  if (this.ownershipVerification.status === 'failed') {
    return 'verification_failed';
  }
  
  if (this.ownershipVerification.status === 'pending') {
    return 'pending_verification';
  }
  
  return 'not_verified';
});

// Index for better query performance
websiteSchema.index({ publisherId: 1 });
websiteSchema.index({ status: 1 });
websiteSchema.index({ domain: 1 });
websiteSchema.index({ country: 1 });
websiteSchema.index({ language: 1 });
websiteSchema.index({ createdAt: -1 });
websiteSchema.index({ 'ownershipVerification.status': 1 });
websiteSchema.index({ 'ownershipVerification.isVerified': 1 });
websiteSchema.index({ 'ownershipVerification.userRole': 1 });

// Pre-save middleware to ensure URL has protocol and extract domain
websiteSchema.pre('save', function(next) {
  if (this.url && !this.url.match(/^https?:\/\//)) {
    this.url = 'https://' + this.url;
  }
  
  // Extract domain from URL
  if (this.url) {
    try {
      const urlObj = new URL(this.url);
      this.domain = urlObj.hostname.replace('www.', '');
    } catch (error) {
      // If URL parsing fails, leave domain as undefined
      this.domain = undefined;
    }
  }
  
  next();
});

// Instance methods for ownership verification
websiteSchema.methods.markOwnershipVerified = function(method, details = {}) {
  this.ownershipVerification.isVerified = true;
  this.ownershipVerification.verifiedAt = new Date();
  this.ownershipVerification.verificationMethod = method;
  this.ownershipVerification.status = 'verified';
  this.ownershipVerification.verificationDetails = details;
  this.ownershipVerification.failureReason = null;
  return this.save();
};

websiteSchema.methods.markOwnershipFailed = function(reason) {
  this.ownershipVerification.isVerified = false;
  this.ownershipVerification.status = 'failed';
  this.ownershipVerification.failureReason = reason;
  this.ownershipVerification.attemptCount += 1;
  this.ownershipVerification.lastAttempted = new Date();
  return this.save();
};

websiteSchema.methods.skipOwnershipVerification = function() {
  this.ownershipVerification.userRole = 'contributor';
  this.ownershipVerification.isVerified = true;
  this.ownershipVerification.verifiedAt = new Date();
  this.ownershipVerification.verificationMethod = 'skip';
  this.ownershipVerification.status = 'skipped';
  return this.save();
};

websiteSchema.methods.resetOwnershipVerification = function() {
  this.ownershipVerification.isVerified = false;
  this.ownershipVerification.verifiedAt = null;
  this.ownershipVerification.verificationMethod = null;
  this.ownershipVerification.status = 'pending';
  this.ownershipVerification.failureReason = null;
  this.ownershipVerification.attemptCount = 0;
  this.ownershipVerification.lastAttempted = null;
  return this.save();
};

// Static method to find websites by ownership verification status
websiteSchema.statics.findByOwnershipStatus = function(status) {
  const query = {};
  
  switch (status) {
    case 'verified':
      query['ownershipVerification.isVerified'] = true;
      break;
    case 'pending':
      query['ownershipVerification.status'] = 'pending';
      break;
    case 'failed':
      query['ownershipVerification.status'] = 'failed';
      break;
    case 'contributor':
      query['ownershipVerification.userRole'] = 'contributor';
      break;
    case 'not_verified':
      query['ownershipVerification.isVerified'] = { $ne: true };
      break;
  }
  
  return this.find(query);
};

module.exports = mongoose.model('Website', websiteSchema);