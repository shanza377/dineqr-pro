// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDS-5MisAqkaU02c9A9dxwcuPV0GWAFdy0",
  authDomain: "dineqr-pro.firebaseapp.com",
  projectId: "dineqr-pro",
  storageBucket: "dineqr-pro.firebasestorage.app",
  messagingSenderId: "365214620093",
  appId: "1:365214620093:web:bf19fb278d479295c49ad4",
  measurementId: "G-CGQWT3FF23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and db
export const auth = getAuth(app);
export const db = getFirestore(app);

export const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dpxvoaalx/image/upload";
export const CLOUDINARY_UPLOAD_PRESET = "dineqr-pro_unsigned";

export default app;