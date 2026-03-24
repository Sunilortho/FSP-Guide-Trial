import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize the Firebase Admin SDK
// This requires a service account key to be added in your environment variables.
// You must set the FIREBASE_SERVICE_ACCOUNT_KEY env variable to the JSON string.

if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY is missing. Firebase Admin operations will fail.');
    }
  } catch (error) {
    console.error('Firebase Admin App initialization error', error);
  }
}

export const adminDb = admin.apps.length ? getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId) : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminStorage = admin.apps.length ? admin.storage() : null;
