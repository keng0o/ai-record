"use client";

import { Chat } from "@/types";

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  setActiveChatId: (id: string) => void;
}

export default function ChatSidebar({
  chats,
  activeChatId,
  setActiveChatId,
}: ChatSidebarProps) {
  return (
    <div>
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => setActiveChatId(chat.id)}
          className={`p-2 mb-2 cursor-pointer rounded ${
            chat.id === activeChatId ? "bg-blue-300" : "bg-white"
          }`}
        ></div>
      ))}
    </div>
  );
}
