const admin = require('firebase-admin');

// Protect against initializeApp being called multiple times during dev (HMR/TurboPack)
// by re-using the already-initialized app when available.
if (!admin.apps || admin.apps.length === 0) {
  // Load service account only when we need to initialize (avoid requiring secrets unnecessarily)
  const serviceAccount = require('./livinglabs-1a831-firebase-adminsdk-fbsvc-0fafb06513.json'); // Adjust path as needed

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Optionally, add databaseURL for Realtime Database or storageBucket for Cloud Storage
    // databaseURL: "https://your-project-id.firebaseio.com",
    // storageBucket: "gs://livinglabs-1a831.firebasestorage.app"
  });
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