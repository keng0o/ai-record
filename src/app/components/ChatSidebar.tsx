"use client";

import { Session } from "@/types";

interface ChatSidebarProps {
  sessions: Session[];
  activeChatId: string | null;
  setActiveChatId: (id: string) => void;
}

export default function ChatSidebar({
  sessions,
  activeChatId,
  setActiveChatId,
}: ChatSidebarProps) {
  return (
    <div>
      {sessions.map((session) => (
        <div
          key={session.id}
          onClick={() => setActiveChatId(session.id)}
          className={`p-2 mb-2 cursor-pointer rounded ${
            session.id === activeChatId ? "bg-blue-300" : "bg-white"
          }`}
        >
          <div className="text-sm font-bold">
            sss
            {/* {session.createdAt.toISOString()} */}
          </div>
        </div>
      ))}
    </div>
  );
}
