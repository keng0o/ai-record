"use client";

interface ChatItem {
  id: string;
  title: string;
}

interface ChatSidebarProps {
  chats: ChatItem[];
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
        >
          {chat.title}
        </div>
      ))}
    </div>
  );
}
