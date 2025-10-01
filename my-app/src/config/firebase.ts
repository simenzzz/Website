import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAKIifkWh4Z9NuJyBn01_jNO0p71Q3mUgw",
    authDomain: "careconnect-76841.firebaseapp.com",
    projectId: "careconnect-76841",
    storageBucket: "careconnect-76841.firebasestorage.app",
    messagingSenderId: "398562829795",
    appId: "1:398562829795:web:c44a02e177742728386cd6",
    measurementId: "G-PYNSM3LSQS"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
