import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3NKd8uDp6oAh6HPy0n36ih9X0oze1k7g",
  authDomain: "attendance-5f43e.firebaseapp.com",
  projectId: "attendance-5f43e",
  storageBucket: "attendance-5f43e.firebasestorage.app",
  messagingSenderId: "109137339038",
  appId: "1:109137339038:web:e1a846d6fa3a1637fe918f",
  measurementId: "G-J6FF4J4PVE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let analytics = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (err) {
    console.warn("Firebase Analytics initialization notice:", err?.message || err);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export {
  app,
  analytics,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser
};
export default app;
