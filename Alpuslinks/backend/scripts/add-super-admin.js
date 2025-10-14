const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');

async function addSuperAdmin() {
  try {
    console.log('🚀 Adding Super Admin user...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/user-management');
    console.log('✅ Connected to MongoDB');

    // Check if Super Admin role exists
    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    if (!superAdminRole) {
      console.error('❌ Super Admin role not found. Please run init-roles.js first.');
      return;
    }
    console.log('✅ Super Admin role found');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'content@portotheme.com' });
    if (existingUser) {
      console.log('⚠️  Super Admin user already exists with email content@portotheme.com');
      console.log(`   User ID: ${existingUser._id}`);
      console.log(`   Name: ${existingUser.firstName} ${existingUser.lastName}`);
      console.log(`   Status: ${existingUser.status}`);
      return;
    }

    // Create Super Admin user
    const superAdminUser = new User({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'content@portotheme.com',
      password: 'SuperAdmin123!', // Default password - should be changed on first login
      role: superAdminRole._id,
      status: 'active',
      emailVerified: true,
      phone: '+1234567890',
      location: 'System'
    });

    await superAdminUser.save();
    console.log('✅ Super Admin user created successfully!');
    console.log(`   Email: content@portotheme.com`);
    console.log(`   Password: SuperAdmin123!`);
    console.log(`   Role: ${superAdminRole.name}`);
    console.log(`   User ID: ${superAdminUser._id}`);
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error adding Super Admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  addSuperAdmin();
}

module.exports = { addSuperAdmin };
