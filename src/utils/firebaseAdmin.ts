// app/firebaseAdmin.ts
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    // 例: サービスアカウントJSONを使うなら:
    // credential: cert(serviceAccountKey),
  });
}

export const firestore = getFirestore();
export const storage = getStorage();
