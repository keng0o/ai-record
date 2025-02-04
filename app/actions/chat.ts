"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { type Chat } from "@/lib/types";

export async function createChat(): Promise<Chat> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const chat = await db.chat.create({
    data: {
      userId: session.user.id,
    },
  });

  return chat;
}

export async function removeChat({ id }: { id: string }) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await db.chat.delete({
    where: {
      id,
      userId: session.user.id,
    },
  });
}

// ... その他のチャット関連のアクション
