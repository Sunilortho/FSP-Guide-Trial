// Quick script to reset loginCount for all users in Firestore
// Run with: node scripts/reset-login-count.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const serviceAccountLine = envContent.split('\n').find(line => line.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY='));

if (!serviceAccountLine) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
  process.exit(1);
}

const serviceAccountJson = serviceAccountLine.replace('FIREBASE_SERVICE_ACCOUNT_KEY=', '');
const serviceAccount = JSON.parse(serviceAccountJson);

// Load firebase config for database ID
const configPath = resolve(__dirname, '..', 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf-8'));

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function resetLoginCounts() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.loginCount && data.loginCount > 0) {
      await doc.ref.update({ loginCount: 0 });
      console.log(`✅ Reset loginCount for ${data.email || doc.id} (was ${data.loginCount})`);
      count++;
    }
  }
  
  console.log(`\n🎉 Done! Reset ${count} user(s).`);
  process.exit(0);
}

resetLoginCounts().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
