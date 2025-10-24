const mongoose = require('mongoose');

const userMetaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  meta_property: {
    type: String,
    required: true,
    trim: true,
    enum: ['phone', 'location', 'city', 'bio', 'website', 'country', 'timezone', 'language', 'twitter', 'linkedin', 'github', 'birthday']
  },
  meta_value: {
    type: String,
    required: false,
    trim: true,
    maxlength: [500, 'Meta value cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance - ensure unique constraint on userId + meta_property combination
userMetaSchema.index({ userId: 1, meta_property: 1 }, { unique: true });

// Remove any old conflicting indexes by ensuring clean schema
userMetaSchema.index({ userId: 1 }); // Non-unique index for userId queries

module.exports = mongoose.model('UserMeta', userMetaSchema);
