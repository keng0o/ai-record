import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getGenerativeModel, getVertexAI } from "firebase/vertexai";

// .env.localなどから読み込むことを推奨
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// アプリ初期化
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const vertexAI = getVertexAI(app);
export const firestore = getFirestore(app);
export const auth = getAuth();
export const googleAuthProvider = new GoogleAuthProvider();
export const model = getGenerativeModel(vertexAI, {
  model: "gemini-1.5-flash",
});
