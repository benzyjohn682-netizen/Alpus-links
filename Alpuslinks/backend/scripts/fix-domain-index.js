const mongoose = require('mongoose');
require('dotenv').config();

async function fixDomainIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/user-management');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('websites');

    // Drop the existing domain index if it exists
    try {
      await collection.dropIndex('domain_1');
      console.log('Dropped existing domain_1 index');
    } catch (error) {
      console.log('Domain index does not exist or already dropped:', error.message);
    }

    // Create a new sparse unique index on domain
    await collection.createIndex({ domain: 1 }, { unique: true, sparse: true });
    console.log('Created new sparse unique index on domain field');

    // Update all documents to have proper domain values
    const websites = await collection.find({}).toArray();
    console.log(`Found ${websites.length} websites to update`);

    for (const website of websites) {
      if (website.url) {
        try {
          const urlObj = new URL(website.url);
          const domain = urlObj.hostname.replace('www.', '');
          
          await collection.updateOne(
            { _id: website._id },
            { $set: { domain: domain } }
          );
          console.log(`Updated website ${website._id} with domain: ${domain}`);
        } catch (error) {
          console.log(`Failed to parse URL for website ${website._id}: ${website.url}`);
        }
      }
    }

    console.log('Domain index fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing domain index:', error);
    process.exit(1);
  }
}

fixDomainIndex();
