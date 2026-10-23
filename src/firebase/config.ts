import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import rawConfig from '../../firebase-applet-config.json';

export const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId || 'committee-4b237',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawConfig.appId || '1:987685275405:web:committee4b237',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket || 'committee-4b237.firebasestorage.app',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (rawConfig as any).apiKey || 'AIzaSy_COMMITTEE_4B237_PLACEHOLDER_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain || 'committee-4b237.firebaseapp.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId || '987685275405'
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Connection validator function as required by Firebase Skill
export async function testFirestoreConnection(): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    await getDocFromServer(doc(db, 'page', 'main'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn("Firestore client is offline. Check Firebase configuration and internet connection.");
    }
    return false;
  }
}
