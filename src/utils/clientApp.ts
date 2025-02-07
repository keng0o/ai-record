// lib/firebase.ts
import { initializeApp } from "firebase/app";
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
};

// アプリ初期化
const firebaseApp = initializeApp(firebaseConfig);

// Storageインスタンスをエクスポート
export const storage = getStorage(firebaseApp);
export const vertexAI = getVertexAI(firebaseApp);
export const model = getGenerativeModel(vertexAI, {
  model: "gemini-1.5-flash",
});
