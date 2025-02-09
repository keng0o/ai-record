import "server-only";

import { db } from "@/utils/clientApp";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";

import { SessionData, SessionStore } from "genkit";

/**
 * セッションで保持したいカスタム情報を定義
 * メッセージ履歴以外にも、ユーザー名・フラグなど何でも追加可能
 */
export interface MySessionState {
  date: string;
  reply: string;
}

export function createLocalSessionStore(
  userId: string
): SessionStore<MySessionState> {
  return {
    async get(
      sessionId: string
    ): Promise<SessionData<MySessionState> | undefined> {
      const docRef = doc(collection(db, "user", userId, "session"), sessionId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists) {
        return undefined;
      }
      return docSnap.data() as SessionData<MySessionState>;
    },

    async save(
      sessionId: string,
      sessionData: SessionData<MySessionState>
    ): Promise<void> {
      const docRef = doc(collection(db, "user", userId, "session"), sessionId);
      setDoc(docRef, sessionData);
    },
  };
}
