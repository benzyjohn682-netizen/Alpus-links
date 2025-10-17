const mongoose = require('mongoose');
const SystemConfig = require('../models/SystemConfig');

async function disable2FA() {
  try {
    console.log('🔧 Disabling 2FA for login...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-management');
    console.log('✅ Connected to MongoDB');

    // Disable 2FA for login
    const systemUserId = new mongoose.Types.ObjectId();
    await SystemConfig.setConfig('2fa_enabled_for_login', false, 'Disable 2FA for login', systemUserId);
    console.log('✅ 2FA disabled for login');

    // Verify the change
    const is2FAEnabled = await SystemConfig.getConfig('2fa_enabled_for_login', false);
    console.log('🔐 2FA enabled for login:', is2FAEnabled);

    console.log('\n🎉 2FA has been disabled!');
    console.log('You can now login with just email and password:');
    console.log('   Email: content@portotheme.com');
    console.log('   Password: SuperAdmin123!');

  } catch (error) {
    console.error('❌ Error disabling 2FA:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  disable2FA();
}

module.exports = { disable2FA };
