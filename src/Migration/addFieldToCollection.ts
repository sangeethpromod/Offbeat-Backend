// migrations/addFieldToCollection.ts
import database from '../Config/database';
import dotenv from 'dotenv';

// Load environment variables from .env.dev
dotenv.config({ path: '../../.env.dev' });

const COLLECTION_NAME = 'stories'; // 👈 change to your collection name
const NEW_FIELD = 'currentCapacity'; // 👈 the new field you want to add
const DEFAULT_VALUE = 15; // 👈 the value you want to assign

async function runMigration() {
  try {
    console.log('Connecting to MongoDB...');
    await database.connect();
    console.log('Connected to MongoDB ✅');

    // 2. Update all documents that don't have the new field
    const db = database.getConnection().db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const result = await db
      .collection(COLLECTION_NAME)
      .updateMany(
        { [NEW_FIELD]: { $exists: false } },
        { $set: { [NEW_FIELD]: DEFAULT_VALUE } }
      );

    console.log(
      `Migration complete: ${result.modifiedCount} documents updated in '${COLLECTION_NAME}'.`
    );
  } catch (err) {
    console.error('Migration failed ❌:', err);
  } finally {
    await database.disconnect();
    console.log('Disconnected from MongoDB 💤');
  }
}

runMigration();
