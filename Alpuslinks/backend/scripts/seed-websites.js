const mongoose = require('mongoose');
const Website = require('../models/Website');
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');

// Sample websites data
const sampleWebsites = [
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    description: 'Leading technology news and startup coverage',
    category: 'technology',
    domainAuthority: 95,
    monthlyTraffic: 15000000,
    language: 'en',
    country: 'United States',
    status: 'active',
    pricing: {
      guestPost: 5000,
      linkInsertion: 2000
    },
    requirements: {
      minWordCount: 800,
      maxLinks: 2,
      allowedTopics: ['technology', 'startups', 'business'],
      prohibitedTopics: ['gambling', 'adult content', 'cryptocurrency']
    },
    contactInfo: {
      email: 'editor@techcrunch.com',
      phone: '+1-555-0123'
    },
    socialMedia: {
      twitter: '@techcrunch',
      linkedin: 'techcrunch',
      facebook: 'techcrunch'
    }
  },
  {
    name: 'Mashable',
    url: 'https://mashable.com',
    description: 'Digital culture and technology news',
    category: 'technology',
    domainAuthority: 88,
    monthlyTraffic: 8000000,
    language: 'en',
    country: 'United States',
    status: 'active',
    pricing: {
      guestPost: 3500,
      linkInsertion: 1500
    },
    requirements: {
      minWordCount: 600,
      maxLinks: 1,
      allowedTopics: ['technology', 'social media', 'digital culture'],
      prohibitedTopics: ['gambling', 'adult content']
    },
    contactInfo: {
      email: 'submissions@mashable.com'
    },
    socialMedia: {
      twitter: '@mashable',
      facebook: 'mashable'
    }
  },
  {
    name: 'Forbes',
    url: 'https://forbes.com',
    description: 'Business and financial news',
    category: 'business',
    domainAuthority: 98,
    monthlyTraffic: 25000000,
    language: 'en',
    country: 'United States',
    status: 'active',
    pricing: {
      guestPost: 10000,
      linkInsertion: 5000
    },
    requirements: {
      minWordCount: 1000,
      maxLinks: 1,
      allowedTopics: ['business', 'finance', 'entrepreneurship'],
      prohibitedTopics: ['gambling', 'adult content', 'cryptocurrency']
    },
    contactInfo: {
      email: 'contributors@forbes.com'
    },
    socialMedia: {
      twitter: '@forbes',
      linkedin: 'forbes',
      facebook: 'forbes'
    }
  },
  {
    name: 'Healthline',
    url: 'https://healthline.com',
    description: 'Health and wellness information',
    category: 'health',
    domainAuthority: 92,
    monthlyTraffic: 12000000,
    language: 'en',
    country: 'United States',
    status: 'active',
    pricing: {
      guestPost: 4000,
      linkInsertion: 2000
    },
    requirements: {
      minWordCount: 700,
      maxLinks: 2,
      allowedTopics: ['health', 'wellness', 'nutrition', 'fitness'],
      prohibitedTopics: ['gambling', 'adult content', 'unproven treatments']
    },
    contactInfo: {
      email: 'editorial@healthline.com'
    },
    socialMedia: {
      twitter: '@healthline',
      facebook: 'healthline'
    }
  },
  {
    name: 'Travel + Leisure',
    url: 'https://travelandleisure.com',
    description: 'Travel guides and destination information',
    category: 'travel',
    domainAuthority: 85,
    monthlyTraffic: 6000000,
    language: 'en',
    country: 'United States',
    status: 'active',
    pricing: {
      guestPost: 3000,
      linkInsertion: 1200
    },
    requirements: {
      minWordCount: 500,
      maxLinks: 2,
      allowedTopics: ['travel', 'destinations', 'hotels', 'restaurants'],
      prohibitedTopics: ['gambling', 'adult content']
    },
    contactInfo: {
      email: 'submissions@travelandleisure.com'
    },
    socialMedia: {
      twitter: '@travelandleisure',
      facebook: 'travelandleisure'
    }
  },
  {
    name: 'Food Network',
    url: 'https://foodnetwork.com',
    description: 'Cooking recipes and food content',
    category: 'food',
    domainAuthority: 90,
    monthlyTraffic: 10000000,
    language: 'en',
    country: 'United States',
    status: 'active',
    pricing: {
      guestPost: 2500,
      linkInsertion: 1000
    },
    requirements: {
      minWordCount: 400,
      maxLinks: 2,
      allowedTopics: ['cooking', 'recipes', 'food', 'restaurants'],
      prohibitedTopics: ['gambling', 'adult content']
    },
    contactInfo: {
      email: 'submissions@foodnetwork.com'
    },
    socialMedia: {
      twitter: '@foodnetwork',
      facebook: 'foodnetwork'
    }
  },
  {
    name: 'ESPN',
    url: 'https://espn.com',
    description: 'Sports news and analysis',
    category: 'sports',
    domainAuthority: 96,
    monthlyTraffic: 20000000,
    language: 'en',
    country: 'United States',
    status: 'active',
    pricing: {
      guestPost: 8000,
      linkInsertion: 3000
    },
    requirements: {
      minWordCount: 600,
      maxLinks: 1,
      allowedTopics: ['sports', 'athletes', 'teams', 'games'],
      prohibitedTopics: ['gambling', 'adult content']
    },
    contactInfo: {
      email: 'editorial@espn.com'
    },
    socialMedia: {
      twitter: '@espn',
      facebook: 'espn'
    }
  },
  {
    name: 'BuzzFeed',
    url: 'https://buzzfeed.com',
    description: 'Viral content and entertainment',
    category: 'entertainment',
    domainAuthority: 89,
    monthlyTraffic: 15000000,
    language: 'en',
    country: 'United States',
    status: 'active',
    pricing: {
      guestPost: 2000,
      linkInsertion: 800
    },
    requirements: {
      minWordCount: 300,
      maxLinks: 3,
      allowedTopics: ['entertainment', 'lifestyle', 'viral content'],
      prohibitedTopics: ['gambling', 'adult content']
    },
    contactInfo: {
      email: 'submissions@buzzfeed.com'
    },
    socialMedia: {
      twitter: '@buzzfeed',
      facebook: 'buzzfeed'
    }
  },
  {
    name: 'The Guardian',
    url: 'https://theguardian.com',
    description: 'International news and opinion',
    category: 'news',
    domainAuthority: 97,
    monthlyTraffic: 18000000,
    language: 'en',
    country: 'United Kingdom',
    status: 'active',
    pricing: {
      guestPost: 6000,
      linkInsertion: 2500
    },
    requirements: {
      minWordCount: 800,
      maxLinks: 1,
      allowedTopics: ['news', 'politics', 'world events', 'opinion'],
      prohibitedTopics: ['gambling', 'adult content']
    },
    contactInfo: {
      email: 'editor@theguardian.com'
    },
    socialMedia: {
      twitter: '@guardian',
      facebook: 'theguardian'
    }
  },
  {
    name: 'Vogue',
    url: 'https://vogue.com',
    description: 'Fashion and lifestyle magazine',
    category: 'fashion',
    domainAuthority: 94,
    monthlyTraffic: 12000000,
    language: 'en',
    country: 'United States',
    status: 'active',
    pricing: {
      guestPost: 7000,
      linkInsertion: 3000
    },
    requirements: {
      minWordCount: 600,
      maxLinks: 1,
      allowedTopics: ['fashion', 'beauty', 'lifestyle', 'celebrities'],
      prohibitedTopics: ['gambling', 'adult content']
    },
    contactInfo: {
      email: 'editorial@vogue.com'
    },
    socialMedia: {
      twitter: '@voguemagazine',
      facebook: 'vogue'
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
      const website = new Website({
        ...websiteData,
        publisherId: publisherUser._id
      });
      
      await website.save();
      createdCount++;
      console.log(`✅ Created website: ${websiteData.name}`);
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
