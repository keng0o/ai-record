import { db } from "@/utils/clientApp";
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
      const docRef = doc(collection(db, "user", userId, "session"), sessionId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists) return undefined;
      return docSnap.data() as SessionData<MySessionState>;
    },
    async save(
      sessionId: string,
      sessionData: SessionData<MySessionState>
    ): Promise<void> {
      const docRef = doc(collection(db, "user", userId, "session"), sessionId);
      await setDoc(docRef, sessionData);
    },
  };
}

export const getSessions = async (userId: string) => {
  const q = query(collection(db, "user", userId, "record"));
  const docSnap = await getDocs(q);
  if (docSnap.empty) {
    return [];
  }
  return docSnap.docs.map((doc) => {
    const { date, reply } = doc.data() as {
      date: string;
      reply: string;
    };
    return {
      sessionId: doc.id,
      role: "user",
      date: date,
      reply,
    };
  });
};

export const getRecord = async (userId: string, recordId: string) => {
  // コレクションパスを"user/{uid}/record"に変更
  const docRef = doc(collection(db, "user", userId, "record"), recordId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists) {
    return null;
  }
  const { date, reply } = docSnap.data() as { date: Timestamp; reply: string };
  return {
    role: "user",
    date: date,
    reply,
  };
};

export const addRecord = async (
  userId: string,
  data: { date: string; reply: string }
) => {
  const docRef = collection(db, "user", userId, "record");
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
  const docRef = doc(db, "user", uid);
  await setDoc(docRef, {
    displayName,
    email,
    photoURL,
  });
};

export const getReords = async (userId: string) => {
  const q = query(collection(db, "user", userId, "record"));
  const docSnap = await getDocs(q);
  if (docSnap.empty) {
    return [];
  }
  return docSnap.docs.map((doc) => {
    const { date, reply } = doc.data();
    return {
      date: date,
      reply,
    };
  });
};
