const mongoose = require('mongoose');
const Category = require('../models/Category');
const User = require('../models/User');
const Role = require('../models/Role');

// Default categories configuration
const defaultCategories = [
  {
    name: 'Technology',
    description: 'Technology, software, and digital innovation content',
    color: '#3B82F6',
    icon: 'zap',
    sortOrder: 1,
    isSystem: true
  },
  {
    name: 'Business',
    description: 'Business, entrepreneurship, and professional content',
    color: '#10B981',
    icon: 'briefcase',
    sortOrder: 2,
    isSystem: true
  },
  {
    name: 'Health',
    description: 'Health, wellness, and medical content',
    color: '#EF4444',
    icon: 'heart',
    sortOrder: 3,
    isSystem: true
  },
  {
    name: 'Finance',
    description: 'Finance, investment, and money management content',
    color: '#F59E0B',
    icon: 'dollar-sign',
    sortOrder: 4,
    isSystem: true
  },
  {
    name: 'Education',
    description: 'Educational content and learning resources',
    color: '#8B5CF6',
    icon: 'book',
    sortOrder: 5,
    isSystem: true
  },
  {
    name: 'Lifestyle',
    description: 'Lifestyle, personal development, and general interest content',
    color: '#EC4899',
    icon: 'star',
    sortOrder: 6,
    isSystem: true
  },
  {
    name: 'Travel',
    description: 'Travel, tourism, and destination content',
    color: '#06B6D4',
    icon: 'map-pin',
    sortOrder: 7,
    isSystem: true
  },
  {
    name: 'Food',
    description: 'Food, cooking, and culinary content',
    color: '#F97316',
    icon: 'utensils',
    sortOrder: 8,
    isSystem: true
  },
  {
    name: 'Sports',
    description: 'Sports, fitness, and athletic content',
    color: '#84CC16',
    icon: 'activity',
    sortOrder: 9,
    isSystem: true
  },
  {
    name: 'Entertainment',
    description: 'Entertainment, movies, music, and media content',
    color: '#F59E0B',
    icon: 'music',
    sortOrder: 10,
    isSystem: true
  },
  {
    name: 'News',
    description: 'News, current events, and journalism content',
    color: '#6B7280',
    icon: 'newspaper',
    sortOrder: 11,
    isSystem: true
  },
  {
    name: 'Fashion',
    description: 'Fashion, style, and clothing content',
    color: '#EC4899',
    icon: 'shirt',
    sortOrder: 12,
    isSystem: true
  },
  {
    name: 'Beauty',
    description: 'Beauty, cosmetics, and personal care content',
    color: '#F472B6',
    icon: 'sparkles',
    sortOrder: 13,
    isSystem: true
  },
  {
    name: 'Parenting',
    description: 'Parenting, family, and child-rearing content',
    color: '#10B981',
    icon: 'baby',
    sortOrder: 14,
    isSystem: true
  },
  {
    name: 'Home',
    description: 'Home improvement, interior design, and household content',
    color: '#8B5CF6',
    icon: 'home',
    sortOrder: 15,
    isSystem: true
  },
  {
    name: 'Automotive',
    description: 'Automotive, cars, and transportation content',
    color: '#6B7280',
    icon: 'car',
    sortOrder: 16,
    isSystem: true
  },
  {
    name: 'Gaming',
    description: 'Gaming, video games, and interactive entertainment content',
    color: '#3B82F6',
    icon: 'gamepad-2',
    sortOrder: 17,
    isSystem: true
  },
  {
    name: 'Photography',
    description: 'Photography, visual arts, and image content',
    color: '#F59E0B',
    icon: 'camera',
    sortOrder: 18,
    isSystem: true
  },
  {
    name: 'Music',
    description: 'Music, audio, and sound content',
    color: '#EC4899',
    icon: 'music',
    sortOrder: 19,
    isSystem: true
  },
  {
    name: 'Art',
    description: 'Art, creativity, and artistic expression content',
    color: '#8B5CF6',
    icon: 'palette',
    sortOrder: 20,
    isSystem: true
  },
  {
    name: 'Other',
    description: 'Miscellaneous and uncategorized content',
    color: '#6B7280',
    icon: 'tag',
    sortOrder: 99,
    isSystem: true
  }
];

async function initializeCategories() {
  try {
    console.log('🚀 Initializing default categories...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-management');
    console.log('✅ Connected to MongoDB');

    // Find a super admin user to be the creator
    const superAdmin = await User.findOne({ role: { $exists: true } }).populate('role');
    if (!superAdmin) {
      console.error('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`✅ Found user: ${superAdmin.firstName} ${superAdmin.lastName}`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const categoryData of defaultCategories) {
      // Check if category already exists
      const existingCategory = await Category.findOne({ name: categoryData.name });
      
      if (existingCategory) {
        console.log(`⚠️  Category "${categoryData.name}" already exists, skipping...`);
        skippedCount++;
        continue;
      }

      // Create category
      const category = new Category({
        ...categoryData,
        createdBy: superAdmin._id
      });

      await category.save();
      console.log(`✅ Created category: ${categoryData.name}`);
      createdCount++;
    }

    console.log('\n📊 Category Initialization Summary:');
    console.log(`   ✅ Created: ${createdCount} categories`);
    console.log(`   ⚠️  Skipped: ${skippedCount} categories (already exist)`);
    console.log(`   📝 Total: ${defaultCategories.length} categories processed`);

    console.log('\n🎉 Category initialization completed successfully!');

  } catch (error) {
    console.error('❌ Error initializing categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the initialization
initializeCategories();
