import * as admin from 'firebase-admin';
import * as path from 'path';

/**
 * Initialize Firebase Admin SDK
 *
 * This module initializes Firebase Admin SDK using the service account key.
 * The service account key should be stored securely as 'serviceAccountKey.json' in the project root.
 */

let firebaseApp: admin.app.App;

try {
  // Path to service account key - stored in project root for security
  const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

  // Initialize Firebase Admin SDK
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    // Add other config as needed, e.g., databaseURL, storageBucket
  });

  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  console.error(
    'Please ensure serviceAccountKey.json is present in the project root'
  );
  throw new Error('Firebase initialization failed');
}

// Export Firebase services
export const auth = admin.auth();
export const firestore = admin.firestore();
export default firebaseApp;
