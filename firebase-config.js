const admin = require('firebase-admin');

// Protect against initializeApp being called multiple times during dev (HMR/TurboPack)
// by re-using the already-initialized app when available.
if (!admin.apps || admin.apps.length === 0) {
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'livinglabs-1a831.firebasestorage.app';

  // In production (Firebase App Hosting / Cloud Run), Application Default Credentials
  // are available automatically — no service account JSON needed.
  // Locally, set GOOGLE_APPLICATION_CREDENTIALS or use the JSON path below.
  const serviceAccountPath = process.env.LIVINGLABS_ADMINSDK_PATH;

  if (serviceAccountPath) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket,
    });
  } else {
    admin.initializeApp({
      storageBucket,
    });
  }
} else {
  // admin already initialized in this process — reuse it
  // (This avoids the "Firebase app named \"[DEFAULT]\" already exists" error.)
}

module.exports = admin;


// Provide a named helper for other modules that import { getAdmin }
function getAdmin() {
  return admin;
}

module.exports.getAdmin = getAdmin;