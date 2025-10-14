const mongoose = require('mongoose');
const SystemConfig = require('../models/SystemConfig');

// Default system configuration
const defaultConfigs = [
  {
    key: 'site_name',
    value: 'AlpusLinks',
    description: 'The name of the website',
    category: 'general'
  },
  {
    key: 'site_description',
    value: 'Professional link building and guest posting platform',
    description: 'The description of the website',
    category: 'general'
  },
  {
    key: 'max_websites_per_publisher',
    value: 50,
    description: 'Maximum number of websites a publisher can register',
    category: 'limits'
  },
  {
    key: 'website_approval_required',
    value: true,
    description: 'Whether websites need admin approval before becoming active',
    category: 'moderation'
  },
  {
    key: 'default_website_status',
    value: 'pending',
    description: 'Default status for new websites',
    category: 'moderation'
  },
  {
    key: 'email_notifications_enabled',
    value: true,
    description: 'Whether to send email notifications',
    category: 'notifications'
  },
  {
    key: 'registration_enabled',
    value: true,
    description: 'Whether new user registration is enabled',
    category: 'access'
  },
  {
    key: 'maintenance_mode',
    value: false,
    description: 'Whether the site is in maintenance mode',
    category: 'access'
  }
];

async function initializeSystemConfig() {
  try {
    console.log('⚙️  Initializing system configuration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alpuslinks');
    console.log('✅ Connected to MongoDB');

    // Create a system user ID for updatedBy field
    const systemUserId = new mongoose.Types.ObjectId();

    let createdCount = 0;
    let updatedCount = 0;

    for (const configData of defaultConfigs) {
      // Check if config already exists
      const existingConfig = await SystemConfig.findOne({ key: configData.key });
      
      if (existingConfig) {
        console.log(`⚠️  Config '${configData.key}' already exists, skipping...`);
        continue;
      }

      // Create new config
      const config = new SystemConfig({
        ...configData,
        updatedBy: systemUserId
      });
      await config.save();
      createdCount++;
      console.log(`✅ Created config: ${configData.key}`);
    }

    console.log(`🎉 System configuration initialized!`);
    console.log(`  - Created: ${createdCount} configs`);
    console.log(`  - Updated: ${updatedCount} configs`);

    // Show all configs
    const allConfigs = await SystemConfig.find({}).sort({ category: 1, key: 1 });
    console.log('\n📋 Current system configuration:');
    allConfigs.forEach(config => {
      console.log(`  - ${config.key}: ${config.value} (${config.category})`);
    });

  } catch (error) {
    console.error('❌ Error initializing system config:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  initializeSystemConfig();
}

module.exports = { initializeSystemConfig, defaultConfigs };
