const mongoose = require('mongoose');

const loginSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loginDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  loginMethod: {
    type: String,
    enum: ['email', 'google', 'email_2fa'],
    default: 'email'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  logoutDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
loginSessionSchema.index({ user: 1, loginDate: 1 });
loginSessionSchema.index({ loginDate: 1 });

// Virtual for session duration
loginSessionSchema.virtual('duration').get(function() {
  if (this.logoutDate) {
    return this.logoutDate - this.loginDate;
  }
  return null;
});

module.exports = mongoose.model('LoginSession', loginSessionSchema);
