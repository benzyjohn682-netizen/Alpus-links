const mongoose = require('mongoose');
const Post = require('../models/Post');
require('dotenv').config();

async function migratePostTypes() {
  try {
    console.log('🔄 Starting Post Type migration...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alpuslinks');
    console.log('✅ Connected to MongoDB');

    // Get all posts that don't have postType set
    const posts = await Post.find({ postType: { $exists: false } });
    console.log(`📊 Found ${posts.length} posts without postType`);

    let updatedCount = 0;

    for (const post of posts) {
      let postType = 'regular'; // Default to regular

      // Determine post type based on content patterns
      if (post.title === 'Link Insertion Request' || 
          post.title.includes('Link Insertion') ||
          (post.title.includes('Link') && post.title.includes('Insertion'))) {
        postType = 'link-insertion';
      } else if (post.title === 'Writing + GP' || 
                 (post.title.includes('Writing') && post.title.includes('GP')) ||
                 post.title === 'Writing + GP Request') {
        postType = 'writing-gp';
      } else if (post.title.length <= 3 && (!post.anchorPairs || post.anchorPairs.length === 0)) {
        // Short titles with no anchor pairs are likely Writing + GP
        postType = 'writing-gp';
      } else if (post.anchorPairs && post.anchorPairs.length > 0 && 
                 !post.title.includes('Writing') && 
                 !post.title.includes('GP')) {
        // Posts with anchor pairs but not Writing + GP are likely Link Insertion
        postType = 'link-insertion';
      }

      // Update the post
      await Post.updateOne(
        { _id: post._id },
        { $set: { postType: postType } }
      );

      console.log(`✅ Updated post "${post.title}" -> ${postType}`);
      updatedCount++;
    }

    console.log('\n🎉 Post Type migration complete!');
    console.log(`📊 Summary:`);
    console.log(`  - Posts processed: ${posts.length}`);
    console.log(`  - Posts updated: ${updatedCount}`);

    // Show breakdown by type
    const regularCount = await Post.countDocuments({ postType: 'regular' });
    const linkInsertionCount = await Post.countDocuments({ postType: 'link-insertion' });
    const writingGPCount = await Post.countDocuments({ postType: 'writing-gp' });
    
    console.log(`  - Regular posts: ${regularCount}`);
    console.log(`  - Link Insertion posts: ${linkInsertionCount}`);
    console.log(`  - Writing + GP posts: ${writingGPCount}`);

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  migratePostTypes();
}

module.exports = migratePostTypes;
