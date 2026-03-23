import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Force session-only persistence: auth state clears when browser/tab is closed
// This ensures no automatic login on return visits
setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.error('Failed to set auth persistence:', error);
});
