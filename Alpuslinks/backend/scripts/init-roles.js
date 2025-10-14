const mongoose = require('mongoose');
const Role = require('../models/Role');

// Default roles configuration
const defaultRoles = [
  {
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: [
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
    color: '#DC2626',
    isActive: true,
    isSystem: true,
    createdBy: null // Will be set to system
  },
  {
    name: 'Admin',
    description: 'Administrative access with most permissions',
    permissions: [
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
      'user_edit',
      'role_edit',
      'support_tickets'
    ],
    color: '#7C3AED',
    isActive: true,
    isSystem: true,
    createdBy: null
  },
  {
    name: 'Publisher',
    description: 'Can manage websites and content',
    permissions: [
      'profile_edit',
      'view_content',
      'reports'
    ],
    color: '#059669',
    isActive: true,
    isSystem: true,
    createdBy: null
  },
  {
    name: 'Advertiser',
    description: 'Can browse and purchase advertising opportunities',
    permissions: [
      'profile_edit',
      'view_content',
      'reports'
    ],
    color: '#2563EB',
    isActive: true,
    isSystem: true,
    createdBy: null
  },
  {
    name: 'Supportor',
    description: 'Customer support role with limited permissions',
    permissions: [
      'profile_edit',
      'view_content',
      'support_tickets'
    ],
    color: '#EA580C',
    isActive: true,
    isSystem: true,
    createdBy: null
  }
];

async function initializeRoles() {
  try {
    console.log('🚀 Initializing default roles...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alpuslinks');
    console.log('✅ Connected to MongoDB');

    // Create a system user ID for createdBy field
    const systemUserId = new mongoose.Types.ObjectId();

    for (const roleData of defaultRoles) {
      // Check if role already exists
      const existingRole = await Role.findOne({ name: roleData.name });
      
      if (existingRole) {
        console.log(`⚠️  Role '${roleData.name}' already exists, skipping...`);
        continue;
      }

      // Create new role
      const role = new Role({
        ...roleData,
        createdBy: systemUserId
      });

      await role.save();
      console.log(`✅ Created role: ${roleData.name}`);
    }

    console.log('🎉 All default roles initialized successfully!');
    
    // List all roles
    const allRoles = await Role.find({}).sort({ name: 1 });
    console.log('\n📋 Current roles in database:');
    allRoles.forEach(role => {
      console.log(`  - ${role.name} (${role.isActive ? 'Active' : 'Inactive'})`);
    });

  } catch (error) {
    console.error('❌ Error initializing roles:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  initializeRoles();
}

module.exports = { initializeRoles, defaultRoles };
