const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    trim: true,
    maxlength: [50, 'Role name cannot exceed 50 characters']
  },
  permissions: [{
    type: String,
    enum: [
      'user_management',
      'role_management',
      'system_settings',
      'data_export',
      'content_moderation',
      'reports',
      'profile_edit',
      'view_content',
      'admin_panel',
      'user_creation',
      'user_deletion',
      'user_edit',
      'role_creation',
      'role_deletion',
      'role_edit',
      'support_tickets'
    ],
    required: true
  }],
  color: {
    type: String,
    default: '#3B82F6',
    match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user count
roleSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'role',
  count: true
});

// Index for better query performance
roleSchema.index({ name: 1 }, { unique: true });
roleSchema.index({ isActive: 1 });
roleSchema.index({ isSystem: 1 });
roleSchema.index({ createdAt: -1 });

// Prevent deletion of system roles
roleSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  if (this.isSystem) {
    const error = new Error('Cannot delete system roles');
    error.statusCode = 400;
    return next(error);
  }
  next();
});

// Prevent updating system role permissions (but allow initial creation)
roleSchema.pre('save', function(next) {
  if (this.isSystem && this.isModified('permissions') && !this.isNew) {
    const error = new Error('Cannot modify permissions of system roles');
    error.statusCode = 400;
    return next(error);
  }
  next();
});

// Static method to get role by name
roleSchema.statics.findByName = function(name) {
  return this.findOne({ name: new RegExp(name, 'i') });
};

// Static method to get active roles
roleSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Method to check if role has permission
roleSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Method to add permission
roleSchema.methods.addPermission = function(permission) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
  return this.save();
};

// Method to remove permission
roleSchema.methods.removePermission = function(permission) {
  this.permissions = this.permissions.filter(p => p !== permission);
  return this.save();
};

module.exports = mongoose.model('Role', roleSchema);
