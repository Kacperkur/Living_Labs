import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'livinglabs-1a831.firebasestorage.app';

if (!admin.apps.length) {
  const serviceAccountPath = process.env.LIVINGLABS_ADMINSDK_PATH;
  if (serviceAccountPath) {
    const resolved = path.resolve(serviceAccountPath);
    const serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket });
  } else {
    // Production: use Application Default Credentials (Firebase App Hosting provides these automatically)
    admin.initializeApp({ storageBucket });
  }
}

export const db = getFirestore();
export const storage = getStorage();
export default admin;
