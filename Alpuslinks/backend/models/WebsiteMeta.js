const mongoose = require('mongoose');

const websiteMetaSchema = new mongoose.Schema({
  websiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: true,
    index: true
  },
  metaProperty: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  metaValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { timestamps: true });

// Compound index to ensure unique meta properties per website
websiteMetaSchema.index({ websiteId: 1, metaProperty: 1 }, { unique: true });

// Static method to get all meta data for a website
websiteMetaSchema.statics.getWebsiteMeta = async function(websiteId) {
  const metaRecords = await this.find({ websiteId });
  const meta = {};
  
  metaRecords.forEach(record => {
    meta[record.metaProperty] = record.metaValue;
  });
  
  return meta;
};

// Helper to flatten nested objects into dot.notation keys
function flattenObject(input, parentKey = '') {
  const result = {};
  if (input == null) return result;

  const isPlainObject = (val) => Object.prototype.toString.call(val) === '[object Object]';

  for (const [key, value] of Object.entries(input)) {
    const propKey = parentKey ? `${parentKey}.${key}` : key;

    if (isPlainObject(value)) {
      Object.assign(result, flattenObject(value, propKey));
    } else {
      result[propKey] = value;
    }
  }
  return result;
}

// Static method to set meta data for a website
websiteMetaSchema.statics.setWebsiteMeta = async function(websiteId, metaData) {
  // Ensure we only ever use string keys; flatten nested structures
  const flattened = flattenObject(metaData || {});

  const operations = [];

  for (const [property, value] of Object.entries(flattened)) {
    const safeProperty = String(property);
    operations.push({
      updateOne: {
        filter: { websiteId, metaProperty: safeProperty },
        update: { metaValue: value },
        upsert: true
      }
    });
  }

  if (operations.length > 0) {
    await this.bulkWrite(operations);
  }
};

// Static method to delete all meta data for a website
websiteMetaSchema.statics.deleteWebsiteMeta = async function(websiteId) {
  return this.deleteMany({ websiteId });
};

module.exports = mongoose.model('WebsiteMeta', websiteMetaSchema);