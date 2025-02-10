"use client";

import { Session } from "@/types";

interface SidebarProps {
  sessions: Session[]; // or adapt if your Session type is different
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
}

/**
 * A simple sidebar listing session objects.
 */
export default function Sidebar({
  sessions,
  activeSessionId,
  setActiveSessionId,
}: SidebarProps) {
  return (
    <div>
      {sessions.map((session) => (
        <div
          key={session.id}
          onClick={() => setActiveSessionId(session.id)}
          className={`p-2 mb-2 cursor-pointer rounded ${
            session.id === activeSessionId ? "bg-blue-300" : "bg-white"
          }`}
        >
          <div className="text-sm font-bold">{session.id}</div>
          {/* <div className="text-xs text-gray-600">
            {session.createdAt?.toString() ?? ""}
          </div> */}
        </div>
      ))}
    </div>
  );
}
