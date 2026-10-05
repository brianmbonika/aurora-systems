import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateEmail,
  verifyBeforeUpdateEmail,
  updatePassword
} from 'firebase/auth';
import { 
  initializeFirestore,
  collection, 
  doc, 
  setDoc, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';

let app = null;
let auth = null;
let db = null;
let isFirebaseInitialized = false;

// Helper to check if a config object looks valid
function isValidConfig(config) {
  return config && config.apiKey && config.projectId && config.appId;
}

// 1. Try to load config from the hardcoded file
let activeConfig = firebaseConfig;

// 2. Fallback to localStorage if the hardcoded one is empty
if (!isValidConfig(activeConfig)) {
  try {
    const storedConfig = localStorage.getItem('aurora_firebase_config');
    if (storedConfig) {
      const parsed = JSON.parse(storedConfig);
      if (isValidConfig(parsed)) {
        activeConfig = parsed;
      }
    }
  } catch (e) {
    console.error("Error loading Firebase config from localStorage:", e);
  }
}

// 3. Initialize if we have a config
if (isValidConfig(activeConfig)) {
  try {
    app = initializeApp(activeConfig);
    auth = getAuth(app);
    // Auto-detect long polling: networks/VPNs/firewalls that block Firestore's default
    // streaming connection otherwise leave getDoc/onSnapshot hanging (login + empty inventory).
    db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
    isFirebaseInitialized = true;
    console.log("Firebase initialized successfully.");
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
}

// Create a login account without signing the current (admin) user out: the default
// auth instance switches to whoever it just created, so use a throwaway second app.
async function createAuthUserKeepingSession(email, password) {
  const secondary = initializeApp(activeConfig, 'user-create');
  try {
    const secondaryAuth = getAuth(secondary);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await signOut(secondaryAuth);
    return cred.user.uid;
  } finally {
    await deleteApp(secondary);
  }
}

export {
  createAuthUserKeepingSession,
  auth,
  db,
  isFirebaseInitialized,
  activeConfig,
  // Auth exports
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateEmail,
  verifyBeforeUpdateEmail,
  updatePassword,
  // Firestore exports
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch
};
