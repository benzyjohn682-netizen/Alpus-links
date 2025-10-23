const mongoose = require('mongoose');
const Website = require('../models/Website');
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');

// Sample websites data
const sampleWebsites = [
  {
    url: 'https://techcrunch.com',
    country: 'United States',
    language: 'en',
    status: 'active',
    pricing: {
      guestPost: 5000,
      linkInsertion: 2000
    }
  },
  {
    url: 'https://mashable.com',
    country: 'United States',
    language: 'en',
    status: 'active',
    pricing: {
      guestPost: 3500,
      linkInsertion: 1500
    }
  },
  {
    url: 'https://forbes.com',
    country: 'United States',
    language: 'en',
    status: 'active',
    pricing: {
      guestPost: 10000,
      linkInsertion: 5000
    }
  },
  {
    url: 'https://healthline.com',
    country: 'United States',
    language: 'en',
    status: 'active',
    pricing: {
      guestPost: 4000,
      linkInsertion: 2000
    }
  },
  {
    url: 'https://travelandleisure.com',
    country: 'United States',
    language: 'en',
    status: 'active',
    pricing: {
      guestPost: 3000,
      linkInsertion: 1200
    }
  },
  {
    url: 'https://foodnetwork.com',
    country: 'United States',
    language: 'en',
    status: 'active',
    pricing: {
      guestPost: 2500,
      linkInsertion: 1000
    }
  },
  {
    url: 'https://espn.com',
    country: 'United States',
    language: 'en',
    status: 'active',
    pricing: {
      guestPost: 8000,
      linkInsertion: 3000
    }
  },
  {
    url: 'https://buzzfeed.com',
    country: 'United States',
    language: 'en',
    status: 'active',
    pricing: {
      guestPost: 2000,
      linkInsertion: 800
    }
  },
  {
    url: 'https://theguardian.com',
    country: 'United Kingdom',
    language: 'en',
    status: 'active',
    pricing: {
      guestPost: 6000,
      linkInsertion: 2500
    }
  },
  {
    url: 'https://vogue.com',
    country: 'United States',
    language: 'en',
    status: 'active',
    pricing: {
      guestPost: 7000,
      linkInsertion: 3000
    }
  }
];

async function seedWebsites() {
  try {
    console.log('🌱 Seeding sample websites...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alpuslinks');
    console.log('✅ Connected to MongoDB');

    // Get or create a sample publisher user
    let publisherUser = await User.findOne({ email: 'publisher@example.com' });
    
    if (!publisherUser) {
      console.log('👤 Creating sample publisher user...');
      
      // Get Publisher role
      const publisherRole = await Role.findOne({ name: 'Publisher' });
      if (!publisherRole) {
        console.log('❌ Publisher role not found. Please run npm run init-roles first.');
        return;
      }

      // Create publisher user
      const hashedPassword = await bcrypt.hash('password123', 10);
      publisherUser = new User({
        firstName: 'John',
        lastName: 'Publisher',
        email: 'publisher@example.com',
        password: hashedPassword,
        role: publisherRole._id,
        isActive: true,
        emailVerified: true
      });
      
      await publisherUser.save();
      console.log('✅ Created sample publisher user');
    } else {
      console.log('✅ Sample publisher user already exists');
    }

    // Clear existing websites (optional - remove this if you want to keep existing data)
    const existingWebsites = await Website.find({});
    if (existingWebsites.length > 0) {
      console.log(`🗑️  Found ${existingWebsites.length} existing websites. Clearing them...`);
      await Website.deleteMany({});
    }

    // Create sample websites
    let createdCount = 0;
    for (const websiteData of sampleWebsites) {
      // Extract domain from URL
      let domain = '';
      try {
        const urlObj = new URL(websiteData.url);
        domain = urlObj.hostname.replace('www.', '');
      } catch (error) {
        console.error(`❌ Invalid URL: ${websiteData.url}`);
        continue;
      }

      const website = new Website({
        ...websiteData,
        domain: domain,
        publisherId: publisherUser._id
      });
      
      await website.save();
      createdCount++;
      console.log(`✅ Created website: ${websiteData.url} (${domain})`);
    }

    console.log(`🎉 Successfully created ${createdCount} sample websites!`);
    
    // Show summary
    const activeWebsites = await Website.find({ status: 'active' });
    console.log(`\n📊 Summary:`);
    console.log(`  - Total websites: ${await Website.countDocuments()}`);
    console.log(`  - Active websites: ${activeWebsites.length}`);
    console.log(`  - Publisher: ${publisherUser.firstName} ${publisherUser.lastName} (${publisherUser.email})`);

    // Show categories
    const categories = await Website.distinct('category', { status: 'active' });
    console.log(`  - Categories: ${categories.join(', ')}`);

  } catch (error) {
    console.error('❌ Error seeding websites:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  seedWebsites();
}

module.exports = { seedWebsites, sampleWebsites };
