const mongoose = require('mongoose');

const twoFactorCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    length: 6
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  purpose: {
    type: String,
    enum: ['login', 'register', 'password_reset'],
    default: 'login'
  }
}, {
  timestamps: true
});

// Index for efficient queries
twoFactorCodeSchema.index({ email: 1, expiresAt: 1 });
twoFactorCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Static method to generate a 6-digit code
twoFactorCodeSchema.statics.generateCode = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to create a new 2FA code
twoFactorCodeSchema.statics.createCode = async function(email, purpose = 'login') {
  // Invalidate any existing codes for this email
  await this.updateMany(
    { email, isUsed: false },
    { isUsed: true }
  );

  const code = this.generateCode();
  const twoFactorCode = new this({
    email,
    code,
    purpose
  });

  await twoFactorCode.save();
  return twoFactorCode;
};

// Instance method to verify code
twoFactorCodeSchema.methods.verifyCode = async function(inputCode) {
  // Check if code is expired
  if (this.expiresAt < new Date()) {
    throw new Error('Verification code has expired');
  }

  // Check if code is already used
  if (this.isUsed) {
    throw new Error('Verification code has already been used');
  }

  // Check if max attempts exceeded
  if (this.attempts >= 3) {
    throw new Error('Maximum verification attempts exceeded');
  }

  // Increment attempts
  this.attempts += 1;
  await this.save();

  // Check if code matches
  if (this.code !== inputCode) {
    throw new Error('Invalid verification code');
  }

  // Mark as used
  this.isUsed = true;
  await this.save();

  return true;
};

module.exports = mongoose.model('TwoFactorCode', twoFactorCodeSchema);
