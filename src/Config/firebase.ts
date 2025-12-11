import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK
 *
 * This module initializes Firebase Admin SDK using the service account JSON from environment variable.
 * The FIREBASE_SERVICE_ACCOUNT_JSON should contain the service account key as a JSON string.
 */

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not set');
}

const serviceAccount = JSON.parse(serviceAccountJson);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });

  console.log('Firebase Admin SDK initialized successfully');
} else {
  console.log('Firebase Admin SDK already initialized');
}

// Export Firebase services
export const auth = admin.auth();
export const firestore = admin.firestore();
export default admin.app();
