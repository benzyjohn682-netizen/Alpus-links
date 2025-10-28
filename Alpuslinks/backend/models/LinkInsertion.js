const mongoose = require('mongoose')

const linkInsertionSchema = new mongoose.Schema({
  // User who created the link insertion
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Post details
  postUrl: {
    type: String,
    required: true,
    trim: true
  },
  
  // Link details
  anchorText: {
    type: String,
    required: true,
    trim: true
  },
  
  anchorUrl: {
    type: String,
    required: true,
    trim: true
  },
  
  // Text content
  currentText: {
    type: String,
    required: true,
    trim: true
  },
  
  fixedText: {
    type: String,
    required: true,
    trim: true
  },
  
  addingText: {
    type: String,
    required: true,
    trim: true
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['draft', 'pending', 'inProgress', 'approved', 'rejected'],
    default: 'draft'
  },
  
  // Admin notes
  adminNotes: {
    type: String,
    trim: true
  },
  
  // Rejection reason (if rejected)
  rejectionReason: {
    type: String,
    trim: true
  },
  
  // Implementation tracking
  implementedAt: {
    type: Date
  },
  
  // Website where it will be implemented (if applicable)
  targetWebsite: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website'
  }
}, {
  timestamps: true
})

// Indexes for better query performance
linkInsertionSchema.index({ userId: 1, status: 1 })
linkInsertionSchema.index({ status: 1, createdAt: -1 })
linkInsertionSchema.index({ postUrl: 1 })
linkInsertionSchema.index({ anchorUrl: 1 })

// Virtual for formatted dates
linkInsertionSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toISOString()
})

linkInsertionSchema.virtual('formattedUpdatedAt').get(function() {
  return this.updatedAt.toISOString()
})

// Ensure virtual fields are serialized
linkInsertionSchema.set('toJSON', { virtuals: true })
linkInsertionSchema.set('toObject', { virtuals: true })

module.exports = mongoose.model('LinkInsertion', linkInsertionSchema)
