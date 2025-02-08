"use client";
import ClientHome from "@/app/components/ClientHome";
import { auth } from "@/utils/clientApp";
import { getSessions } from "@/utils/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// クライアントで行う表示部分
export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User>();
  const [sessions, setSessions] = useState<
    { sessionId: string; role: string; date: string; reply: string }[]
  >([]);

  useEffect(() => {
    return onAuthStateChanged(auth, async (_user) => {
      if (!_user) {
        router.push("/jp");
        return;
      }
      setUser(_user);
      const _sessions = await getSessions(_user.uid);
      setSessions(_sessions);
    });
  }, []);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <main className="h-screen">
      <ClientHome sessions={sessions} uid={user.uid} />
    </main>
  );
}
