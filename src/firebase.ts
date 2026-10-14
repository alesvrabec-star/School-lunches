import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Must use firestoreDatabaseId and ignoreUndefinedProperties so undefined fields never crash Firestore
export const db = initializeFirestore(
  app,
  {
    ignoreUndefinedProperties: true,
  },
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(app);

// Test Firestore connection on boot as required by skill
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection check: client is offline or initializing.');
    }
  }
}

export async function ensureAuth() {
  return auth.currentUser;
}
