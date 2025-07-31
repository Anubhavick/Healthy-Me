// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCgCrZAgq7ZvjYQhVF8X_Em2U44apDuTB4",
  authDomain: "diet-scanner-8ea5c.firebaseapp.com",
  projectId: "diet-scanner-8ea5c",
  storageBucket: "diet-scanner-8ea5c.firebasestorage.app",
  messagingSenderId: "250418808998",
  appId: "1:250418808998:web:8d9659c176ac2a3589cc67",
  measurementId: "G-YTFRHDZ13Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
