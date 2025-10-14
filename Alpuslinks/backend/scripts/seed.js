const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/user-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Role.deleteMany({});

    console.log('Cleared existing data');

    // Create default admin user first
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'admin123',
      status: 'active',
      emailVerified: true
    });

    await adminUser.save();

    // Create default roles
    const adminRole = new Role({
      name: 'Admin',
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
        'role_edit'
      ],
      color: '#DC2626',
      isActive: true,
      isSystem: true,
      createdBy: adminUser._id
    });

    const supportorRole = new Role({
      name: 'Supportor',
      description: 'Customer support with limited permissions',
      permissions: [
        'profile_edit',
        'view_content',
        'support_tickets'
      ],
      color: '#059669',
      isActive: true,
      isSystem: true,
      createdBy: adminUser._id
    });

    const publisherRole = new Role({
      name: 'Publisher',
      description: 'Can create and manage content',
      permissions: [
        'profile_edit',
        'view_content',
        'user_creation',
        'user_edit'
      ],
      color: '#7C3AED',
      isActive: true,
      isSystem: true,
      createdBy: adminUser._id
    });

    const advertiserRole = new Role({
      name: 'Advertiser',
      description: 'Can create and manage advertisements',
      permissions: [
        'profile_edit',
        'view_content',
        'user_creation',
        'user_edit'
      ],
      color: '#DC2626',
      isActive: true,
      isSystem: true,
      createdBy: adminUser._id
    });

    await adminRole.save();
    await supportorRole.save();
    await publisherRole.save();
    await advertiserRole.save();

    console.log('Created default roles');

    // Update admin user with admin role
    adminUser.role = adminRole._id;
    await adminUser.save();

    console.log('Updated admin user with role');

    // Create sample users
    const sampleUsers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: supportorRole._id,
        status: 'active',
        phone: '15551234567',
        location: 'New York, NY'
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'password123',
        role: publisherRole._id,
        status: 'active',
        phone: '15559876543',
        location: 'Los Angeles, CA'
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@example.com',
        password: 'password123',
        role: advertiserRole._id,
        status: 'inactive',
        phone: '15554567890',
        location: 'Chicago, IL'
      }
    ];

    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
    }

    console.log('Created sample users');

    console.log('\n=== Database Seeded Successfully ===');
    console.log('Default Admin User:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('\nSample Users:');
    console.log('Email: john.doe@example.com, Password: password123 (Supportor)');
    console.log('Email: jane.smith@example.com, Password: password123 (Publisher)');
    console.log('Email: mike.johnson@example.com, Password: password123 (Advertiser)');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run seeder
seedDatabase();
