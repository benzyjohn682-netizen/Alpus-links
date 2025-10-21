const mongoose = require('mongoose');
const Post = require('../models/Post');
require('dotenv').config();

async function fixWritingGPPosts() {
  try {
    console.log('🔄 Fixing Writing + GP posts...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alpuslinks');
    console.log('✅ Connected to MongoDB');

    // Find posts that should be Writing + GP based on short titles
    const shortTitlePosts = await Post.find({
      $expr: { $lte: [{ $strLenCP: "$title" }, 10] }, // Title length <= 10 characters
      postType: { $ne: 'writing-gp' }
    });

    console.log(`📊 Found ${shortTitlePosts.length} posts with short titles that might be Writing + GP`);

    let updatedCount = 0;

    for (const post of shortTitlePosts) {
      console.log(`Processing: "${post.title}" (current type: ${post.postType})`);
      
      // Update to writing-gp
      await Post.updateOne(
        { _id: post._id },
        { $set: { postType: 'writing-gp' } }
      );

      console.log(`✅ Updated "${post.title}" -> writing-gp`);
      updatedCount++;
    }

    console.log('\n🎉 Writing + GP posts fix complete!');
    console.log(`📊 Summary:`);
    console.log(`  - Posts processed: ${shortTitlePosts.length}`);
    console.log(`  - Posts updated: ${updatedCount}`);

    // Show final breakdown
    const regularCount = await Post.countDocuments({ postType: 'regular' });
    const linkInsertionCount = await Post.countDocuments({ postType: 'link-insertion' });
    const writingGPCount = await Post.countDocuments({ postType: 'writing-gp' });
    
    console.log(`  - Regular posts: ${regularCount}`);
    console.log(`  - Link Insertion posts: ${linkInsertionCount}`);
    console.log(`  - Writing + GP posts: ${writingGPCount}`);

  } catch (error) {
    console.error('❌ Error during fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  fixWritingGPPosts();
}

module.exports = fixWritingGPPosts;
