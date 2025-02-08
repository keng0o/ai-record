import { firestore } from "@/utils/clientApp";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import { SessionData, SessionStore } from "genkit";

export interface MySessionState {
  date: string;
  reply: string;
}

// user/uid/record/uuid

export function createLocalSessionStore(
  userId: string
): SessionStore<MySessionState> {
  return {
    async get(
      sessionId: string
    ): Promise<SessionData<MySessionState> | undefined> {
      const docRef = doc(
        collection(firestore, "user", userId, "record"),
        sessionId
      );
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists) return undefined;
      return docSnap.data() as SessionData<MySessionState>;
    },
    async save(
      sessionId: string,
      sessionData: SessionData<MySessionState>
    ): Promise<void> {
      const docRef = doc(
        collection(firestore, "user", userId, "record"),
        sessionId
      );
      await setDoc(docRef, sessionData);
    },
  };
}

export const getSessions = async (userId: string) => {
  const q = query(collection(firestore, "user", userId, "record"));
  const docSnap = await getDocs(q);
  if (docSnap.empty) {
    return [];
  }
  return docSnap.docs.map((doc) => {
    const { date, reply } = doc.data() as {
      date: Timestamp;
      reply: string;
    };
    return {
      sessionId: doc.id,
      role: "user",
      date: date.toDate().toISOString(),
      reply,
    };
  });
};

export const getRecord = async (userId: string, recordId: string) => {
  // コレクションパスを"user/{uid}/record"に変更
  const docRef = doc(collection(firestore, "user", userId, "record"), recordId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists) {
    return null;
  }
  const { date, reply } = docSnap.data() as { date: Timestamp; reply: string };
  return {
    role: "user",
    date: date.toDate().toISOString(),
    reply,
  };
};

export const addRecord = async (
  userId: string,
  data: { date: string; reply: string }
) => {
  const docRef = collection(firestore, "user", userId, "record");
  await addDoc(docRef, data);
};

export const addUser = async ({
  uid,
  displayName,
  email,
  photoURL,
}: {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}) => {
  // コレクションパスを"user"に変更
  const docRef = doc(firestore, "user", uid);
  await setDoc(docRef, {
    displayName,
    email,
    photoURL,
  });
};
