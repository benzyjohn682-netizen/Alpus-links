const mongoose = require('mongoose');
const Website = require('../models/Website');
const WebsiteMeta = require('../models/WebsiteMeta');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrateWebsiteMeta() {
  try {
    console.log('🔄 Starting WebsiteMeta migration to key-value structure...');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alpuslinks');
    console.log('✅ Connected to MongoDB');

    // First, drop the existing WebsiteMeta collection to start fresh
    await WebsiteMeta.collection.drop();
    console.log('🗑️ Dropped existing WebsiteMeta collection');

    // Get all websites
    const websites = await Website.find({});
    console.log(`📊 Found ${websites.length} websites to migrate`);

    let totalMetaRecords = 0;

    for (const website of websites) {
      console.log(`\n🔄 Processing website: ${website.domain || website.url}`);
      
      // Create meta records for each property that exists
      const metaProperties = {
        // Metrics
        mozDA: website.domainAuthority,
        ahrefsDR: website.ahrefsDR,
        semrushTraffic: website.monthlyTraffic,
        googleAnalyticsTraffic: website.googleAnalyticsTraffic,
        
        // Requirements
        minWordCount: website.requirements?.minWordCount,
        maxLinks: website.requirements?.maxLinks,
        allowedTopics: website.requirements?.allowedTopics,
        prohibitedTopics: website.requirements?.prohibitedTopics,
        
        // Other properties
        sponsored: website.sponsored,
        email: website.contactInfo?.email,
        phone: website.contactInfo?.phone,
        twitter: website.socialMedia?.twitter,
        linkedin: website.socialMedia?.linkedin,
        facebook: website.socialMedia?.facebook,
        notes: website.notes
      };

      // Create meta records for non-undefined values
      const metaRecords = [];
      for (const [property, value] of Object.entries(metaProperties)) {
        if (value !== undefined && value !== null) {
          metaRecords.push({
            websiteId: website._id,
            metaProperty: property,
            metaValue: value
          });
        }
      }

      if (metaRecords.length > 0) {
        await WebsiteMeta.insertMany(metaRecords);
        totalMetaRecords += metaRecords.length;
        console.log(`  ✅ Created ${metaRecords.length} meta records`);
      } else {
        console.log(`  ⏩ No meta data to migrate`);
      }
    }

    console.log('\n🎉 WebsiteMeta migration complete!');
    console.log(`📊 Summary:`);
    console.log(`  - Websites processed: ${websites.length}`);
    console.log(`  - Total meta records created: ${totalMetaRecords}`);
    console.log(`  - Average meta records per website: ${(totalMetaRecords / websites.length).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  migrateWebsiteMeta();
}

module.exports = migrateWebsiteMeta;
