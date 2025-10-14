const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    default: 'general',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
systemConfigSchema.index({ key: 1 }, { unique: true });
systemConfigSchema.index({ category: 1 });

// Static method to get configuration value
systemConfigSchema.statics.getConfig = async function(key, defaultValue = null) {
  try {
    const config = await this.findOne({ key, isActive: true });
    return config ? config.value : defaultValue;
  } catch (error) {
    console.error('Error getting config:', error);
    return defaultValue;
  }
};

// Static method to set configuration value
systemConfigSchema.statics.setConfig = async function(key, value, description = '', updatedBy) {
  try {
    const config = await this.findOneAndUpdate(
      { key },
      { 
        value, 
        description,
        updatedBy,
        isActive: true 
      },
      { 
        upsert: true, 
        new: true 
      }
    );
    return config;
  } catch (error) {
    console.error('Error setting config:', error);
    throw error;
  }
};

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
