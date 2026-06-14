import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateEmail, 
  updatePassword 
} from 'firebase/auth';
import { 
  getFirestore, 
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
    db = getFirestore(app);
    isFirebaseInitialized = true;
    console.log("Firebase initialized successfully.");
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
}

export {
  auth,
  db,
  isFirebaseInitialized,
  activeConfig,
  // Auth exports
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateEmail,
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
