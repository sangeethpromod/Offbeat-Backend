import mongoose from 'mongoose';
import Story from '../Model/storyModel';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.dev
const envFile = path.resolve(process.cwd(), '.env.dev');
console.log(`Loading environment from: ${envFile}`);
dotenv.config({ path: envFile });

/**
 * Migration script to add tags field to existing stories
 *
 * This script adds default tags to all existing stories that don't have the tags field.
 * The tags field is required and must contain 4-6 string items.
 *
 * Usage:
 * npm run migrate:tags
 *
 * What it does:
 * 1. Connects to MongoDB
 * 2. Finds all stories without tags
 * 3. Adds default tags: ['adventure', 'travel', 'experience', 'culture', 'nature', 'exploration']
 * 4. Updates each story in the database
 * 5. Verifies the migration was successful
 */
async function migrateTagsToStories() {
  try {
    // Connect to MongoDB (adjust connection string as needed)
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    console.log(
      `Environment variables loaded: ${Object.keys(process.env).length} variables`
    );
    console.log(`MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
    console.log(
      `Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***:***@').replace(/:[^:]+@/, ':***@')}`
    ); // Hide credentials in logs

    await mongoose.connect(mongoUri);

    console.log('✅ Connected to MongoDB');

    // Check if connection is ready
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }

    console.log(`Database name: ${mongoose.connection.db.databaseName}`);
    console.log(
      `Story model collection name: ${Story.collection.collectionName || Story.collection.name}`
    );
    console.log(
      `Collections: ${Object.keys(mongoose.connection.collections).join(', ')}`
    );

    // Check if stories collection exists
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    const collectionNames = collections.map(col => col.name);
    console.log(`Available collections: ${collectionNames.join(', ')}`);

    const hasStoriesCollection = collectionNames.includes('stories');
    console.log(`Stories collection exists: ${hasStoriesCollection}`);

    if (!hasStoriesCollection) {
      console.log('❌ Stories collection does not exist. Creating it...');
      // The collection will be created when we first save a document
    }

    // Get total count first
    const totalCount = await mongoose.connection.db
      .collection('stories')
      .countDocuments();
    console.log(`Raw document count in stories collection: ${totalCount}`);

    // Try to find all stories using native MongoDB driver
    const allStories = await mongoose.connection.db
      .collection('stories')
      .find({})
      .limit(5)
      .toArray();
    console.log(`Sample stories found: ${allStories.length}`);
    if (allStories.length > 0) {
      console.log('Sample story:', JSON.stringify(allStories[0], null, 2));
    }

    // Find all stories that don't have tags field
    console.log('🔍 Searching for stories without tags...');
    const storiesWithoutTags = await Story.find({
      $or: [
        { tags: { $exists: false } },
        { tags: { $size: 0 } },
        { tags: null },
      ],
    });

    console.log(
      `Found ${storiesWithoutTags.length} stories without tags using Mongoose`
    );

    // Also try with native MongoDB
    const nativeQuery = {
      $or: [
        { tags: { $exists: false } },
        { tags: { $size: 0 } },
        { tags: null },
      ],
    };
    const nativeCount = await mongoose.connection.db
      .collection('stories')
      .countDocuments(nativeQuery);
    console.log(
      `Found ${nativeCount} stories without tags using native MongoDB`
    );

    // If no stories found, let's see what stories exist
    const allStoriesMongoose = await Story.find({}).limit(3);
    console.log(
      `Total stories found with Mongoose: ${allStoriesMongoose.length}`
    );

    const allStoriesNative = await mongoose.connection.db
      .collection('stories')
      .find({})
      .limit(3)
      .toArray();
    console.log(
      `Total stories found with native driver: ${allStoriesNative.length}`
    );

    if (allStoriesNative.length > 0) {
      console.log(
        'First story sample:',
        JSON.stringify(allStoriesNative[0], null, 2)
      );
    }

    // Default tags to add (4-6 tags as required)
    const defaultTags = [
      'adventure',
      'travel',
      'experience',
      'culture',
      'nature',
      'exploration',
    ];

    let updatedCount = 0;

    // Update each story with default tags
    for (const story of storiesWithoutTags) {
      try {
        await Story.findOneAndUpdate(
          { _id: story._id },
          {
            tags: defaultTags,
          },
          { new: true, runValidators: false } // Skip validation during migration
        );

        updatedCount++;
        console.log(`Updated story: ${story.storyId} (${story.storyTitle})`);
      } catch (error) {
        console.error(`Failed to update story ${story.storyId}:`, error);
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} stories.`);

    // Verify the migration
    const totalStories = await Story.countDocuments();
    const storiesWithTags = await Story.countDocuments({
      tags: { $exists: true, $ne: null, $type: 'array' },
    });

    console.log(`Total stories: ${totalStories}`);
    console.log(`Stories with tags array: ${storiesWithTags}`);

    // Check if tags have valid length (4-6 items)
    const storiesWithValidTags = await Story.find({
      tags: { $exists: true, $ne: null, $type: 'array' },
    }).select('tags storyId storyTitle');

    let validTagCount = 0;
    for (const story of storiesWithValidTags) {
      if (
        story.tags &&
        Array.isArray(story.tags) &&
        story.tags.length >= 4 &&
        story.tags.length <= 6
      ) {
        validTagCount++;
      }
    }

    console.log(`Stories with valid tags (4-6 items): ${validTagCount}`);

    if (validTagCount === totalStories) {
      console.log('✅ Migration successful! All stories now have valid tags.');
    } else {
      console.log(
        `⚠️  Migration completed but ${totalStories - validTagCount} stories may still be missing valid tags.`
      );
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateTagsToStories()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export default migrateTagsToStories;
