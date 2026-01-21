import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase client-side config (from your Firebase console)
// For production/GitHub, you can optionally move these to environment variables.
const firebaseConfig = {
  apiKey: "AIzaSyCqeOS90Bb9d06bTRSAsVUImKPI-8KXU_4",
  authDomain: "taskflow-e8862.firebaseapp.com",
  projectId: "taskflow-e8862",
  storageBucket: "taskflow-e8862.firebasestorage.app",
  messagingSenderId: "1080819727677",
  appId: "1:1080819727677:web:677dd48a76169583a89954",
  measurementId: "G-TPC0PD9H67",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth + Firestore instances
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;


