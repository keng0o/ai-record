"use client";

import { auth, googleAuthProvider } from "@/lib/firebase";
import { addUser } from "@/lib/firestore";
import { onAuthStateChanged, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Login() {
  const router = useRouter();

  // ログイン状態をチェックし、ログイン済みならリダイレクトする
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/");
      }
    });
  }, [router]);

  const signInWithGoogle = async () => {
    try {
      const { user } = await signInWithPopup(auth, googleAuthProvider);
      await addUser({
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
      });
    } catch (error) {
      console.error("Error during Google login", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <section className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to AI Record</h1>
        <p className="text-lg">
          機能紹介: 当サービスはAIを活用した記録管理と分析を提供します。
        </p>
      </section>
      <section className="w-full max-w-md">
        <form className="flex flex-col space-y-4">
          <button
            type="button"
            className="bg-red-500 text-white py-2"
            onClick={signInWithGoogle}
          >
            Google Login
          </button>
        </form>
      </section>
    </div>
  );
}
