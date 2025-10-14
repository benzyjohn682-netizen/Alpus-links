const mongoose = require('mongoose');
const Website = require('../models/Website');
const WebsiteMeta = require('../models/WebsiteMeta');

async function initWebsiteMeta() {
  try {
    console.log('🔧 Initializing WebsiteMeta collection...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alpuslinks');
    console.log('✅ Connected to MongoDB');

    // Get all existing websites
    const websites = await Website.find({});
    console.log(`📊 Found ${websites.length} existing websites`);

    if (websites.length === 0) {
      console.log('⚠️  No websites found. Please create some websites first.');
      return;
    }

    // Create WebsiteMeta records for existing websites
    let createdCount = 0;
    let updatedCount = 0;

    for (const website of websites) {
      // Check if WebsiteMeta already exists for this website
      const existingMeta = await WebsiteMeta.findOne({ websiteId: website._id });
      
      if (existingMeta) {
        console.log(`⏭️  WebsiteMeta already exists for ${website.domain || website.url}`);
        updatedCount++;
        continue;
      }

      // Create WebsiteMeta record with default values
      const websiteMeta = new WebsiteMeta({
        websiteId: website._id,
        metrics: {
          mozDA: null,
          ahrefsDR: null,
          semrushTraffic: null,
          googleAnalyticsTraffic: null,
          lastChecked: null
        },
        requirements: {
          minWordCount: null,
          maxLinks: null,
          allowedTopics: [],
          prohibitedTopics: []
        },
        sponsored: false,
        contactInfo: {
          email: null,
          phone: null
        },
        socialMedia: {
          twitter: null,
          linkedin: null,
          facebook: null
        },
        notes: null
      });

      await websiteMeta.save();
      createdCount++;
      console.log(`✅ Created WebsiteMeta for ${website.domain || website.url}`);
    }

    console.log(`\n🎉 WebsiteMeta initialization complete!`);
    console.log(`📊 Summary:`);
    console.log(`  - New WebsiteMeta records created: ${createdCount}`);
    console.log(`  - Existing WebsiteMeta records: ${updatedCount}`);
    console.log(`  - Total websites: ${websites.length}`);

    // Verify the collection exists and has data
    const metaCount = await WebsiteMeta.countDocuments();
    console.log(`  - Total WebsiteMeta records: ${metaCount}`);

  } catch (error) {
    console.error('❌ Error initializing WebsiteMeta:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  initWebsiteMeta();
}

module.exports = { initWebsiteMeta };
