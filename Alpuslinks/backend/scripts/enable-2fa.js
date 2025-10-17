const mongoose = require('mongoose');
const SystemConfig = require('../models/SystemConfig');

async function enable2FA() {
  try {
    console.log('🔧 Enabling 2FA for login...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-management');
    console.log('✅ Connected to MongoDB');

    // Enable 2FA for login
    const systemUserId = new mongoose.Types.ObjectId();
    await SystemConfig.setConfig('2fa_enabled_for_login', true, 'Enable 2FA for login', systemUserId);
    console.log('✅ 2FA enabled for login');

    // Verify the change
    const is2FAEnabled = await SystemConfig.getConfig('2fa_enabled_for_login', false);
    console.log('🔐 2FA enabled for login:', is2FAEnabled);

    console.log('\n🎉 2FA has been enabled!');
    console.log('Now when you login:');
    console.log('1. Enter email and password');
    console.log('2. 2FA modal will appear');
    console.log('3. Check server console for verification code');
    console.log('4. Enter the code to complete login');

  } catch (error) {
    console.error('❌ Error enabling 2FA:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  enable2FA();
}

module.exports = { enable2FA };
