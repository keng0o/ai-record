"use client";

import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createSession } from "@/app/actions";
import { auth } from "@/lib/firebase";
import { getSession } from "@/lib/firestore";
import { Session } from "@/types";
import Home from "./components/Home";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session>();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
        return;
      }
      const _sessionId = await createSession(firebaseUser.uid);
      console.log("🚀 ~ unsubscribe ~ _sessionId:", _sessionId);
      setUser(firebaseUser);
      const _session = await getSession(firebaseUser.uid, _sessionId);
      console.log("🚀 ~ unsubscribe ~ _session:", _session);
      if (!_session) return;
      setSession(_session);
    });
    return () => unsubscribe();
  }, [router]);

  if (!user || !session) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <main className="h-screen">
      <Home uid={user.uid} session={session} />
    </main>
  );
}
