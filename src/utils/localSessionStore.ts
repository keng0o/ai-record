import { firestore } from "@/utils/clientApp";
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

const SESSIONS_COLLECTION = "sessions";

/**
 * ローカルファイルにセッションデータを保存する SessionStore を返す。
 * "class" を使わずオブジェクトリテラルで実装例を示す。
 */
export function createLocalSessionStore(): SessionStore<MySessionState> {
  return {
    async get(
      sessionId: string
    ): Promise<SessionData<MySessionState> | undefined> {
      const docRef = doc(collection(firestore, SESSIONS_COLLECTION), sessionId);
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
      const docRef = doc(collection(firestore, SESSIONS_COLLECTION), sessionId);
      setDoc(docRef, sessionData);
    },
  };
}
