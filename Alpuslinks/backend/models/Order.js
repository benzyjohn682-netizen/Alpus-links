const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  advertiserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  publisherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  websiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: true,
    index: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: false
  },
  linkInsertionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LinkInsertion',
    required: false
  },
  type: {
    type: String,
    enum: ['guestPost', 'linkInsertion', 'writingGuestPost'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['requested', 'inProgress', 'advertiserApproval', 'completed', 'rejected'],
    default: 'requested',
    index: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  requirements: {
    minWordCount: { type: Number, default: 0 },
    maxLinks: { type: Number, default: 0 },
    allowedTopics: [{ type: String }],
    prohibitedTopics: [{ type: String }],
    deadline: { type: Date }
  },
  notes: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  completedAt: {
    type: Date
  },
  // Track order timeline
  timeline: [{
    status: {
      type: String,
      enum: ['requested', 'inProgress', 'advertiserApproval', 'completed', 'rejected']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ advertiserId: 1, status: 1 });
orderSchema.index({ publisherId: 1, status: 1 });
orderSchema.index({ websiteId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ type: 1, status: 1 });

// Virtual for formatted dates
orderSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toISOString();
});

orderSchema.virtual('formattedUpdatedAt').get(function() {
  return this.updatedAt.toISOString();
});

// Method to update order status with timeline tracking
orderSchema.methods.updateStatus = function(newStatus, note = '', updatedBy = null) {
  this.status = newStatus;
  
  // Add to timeline
  this.timeline.push({
    status: newStatus,
    timestamp: new Date(),
    note: note,
    updatedBy: updatedBy
  });
  
  // Set completedAt if status is completed
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Ensure virtual fields are serialized
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
