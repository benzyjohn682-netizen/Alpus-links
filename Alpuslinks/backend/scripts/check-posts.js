const mongoose = require('mongoose');
const Post = require('../models/Post');
require('dotenv').config();

async function checkPosts() {
  try {
    console.log('🔍 Checking current posts...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alpuslinks');
    console.log('✅ Connected to MongoDB');

    // Get all posts
    const posts = await Post.find({});
    console.log(`📊 Found ${posts.length} total posts`);

    for (const post of posts) {
      console.log(`\n📝 Post: "${post.title}"`);
      console.log(`   - ID: ${post._id}`);
      console.log(`   - Type: ${post.postType || 'undefined'}`);
      console.log(`   - Status: ${post.status}`);
      console.log(`   - Anchor Pairs: ${post.anchorPairs ? post.anchorPairs.length : 0}`);
      console.log(`   - Created: ${post.createdAt}`);
    }

    // Show breakdown by type
    const regularCount = await Post.countDocuments({ postType: 'regular' });
    const linkInsertionCount = await Post.countDocuments({ postType: 'link-insertion' });
    const writingGPCount = await Post.countDocuments({ postType: 'writing-gp' });
    const undefinedCount = await Post.countDocuments({ postType: { $exists: false } });
    
    console.log(`\n📊 Summary:`);
    console.log(`  - Regular posts: ${regularCount}`);
    console.log(`  - Link Insertion posts: ${linkInsertionCount}`);
    console.log(`  - Writing + GP posts: ${writingGPCount}`);
    console.log(`  - Undefined type: ${undefinedCount}`);

  } catch (error) {
    console.error('❌ Error checking posts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  checkPosts();
}

module.exports = checkPosts;
