// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    FacebookAuthProvider,
    OAuthProvider,
    signInWithPopup,
} from "firebase/auth";

// ✅ Firebase config comes from your environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize Firebase (only once)
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/** ---- Providers ---- */
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const appleProvider = new OAuthProvider("apple.com");

/** ---- Social Login Functions ---- */
export async function loginWithGoogle(): Promise<string> {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user.getIdToken(); // Firebase ID Token
}

export async function loginWithFacebook(): Promise<string> {
    const result = await signInWithPopup(auth, facebookProvider);
    return result.user.getIdToken();
}

export async function loginWithApple(): Promise<string> {
    const result = await signInWithPopup(auth, appleProvider);
    return result.user.getIdToken();
}
