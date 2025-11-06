// migrations/updateStorySchema.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.dev
const envPath = path.resolve(__dirname, '../../.env.dev');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

import database from '../Config/database';

const COLLECTION_NAME = 'stories';

async function runMigration() {
  try {
    console.log('Connecting to MongoDB...');
    await database.connect();
    console.log('Connected to MongoDB ✅');

    const db = database.getConnection().db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    console.log('Starting story schema migration...');

    // 1. Remove old fields
    const removeFieldsResult = await db.collection(COLLECTION_NAME).updateMany(
      {},
      {
        $unset: {
          startDate: 1,
          endDate: 1,
          noOfDays: 1,
          currentCapacity: 1,
        },
      }
    );

    console.log(
      `Removed old fields from ${removeFieldsResult.modifiedCount} documents`
    );

    // 2. Add new storyLength field with default value of 1
    const addFieldResult = await db
      .collection(COLLECTION_NAME)
      .updateMany(
        { storyLength: { $exists: false } },
        { $set: { storyLength: 4 } }
      );

    console.log(
      `Added storyLength field to ${addFieldResult.modifiedCount} documents`
    );

    // 3. Optional: Update existing stories with more appropriate lengths based on their content
    // For example, if they have itinerary data, we could estimate length, but for now we'll use default

    console.log('Migration complete! ✅');
    console.log(`Summary:
- Removed old fields (startDate, endDate, noOfDays, currentCapacity) from ${removeFieldsResult.modifiedCount} documents
- Added storyLength field to ${addFieldResult.modifiedCount} documents`);
  } catch (err) {
    console.error('Migration failed ❌:', err);
  } finally {
    await database.disconnect();
    console.log('Disconnected from MongoDB 💤');
  }
}

runMigration();
