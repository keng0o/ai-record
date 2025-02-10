"use client";

import { Thread } from "@/types";
import { useState } from "react";

/**
 * Displays the current Session's messages and an input for the user to ask questions.
 */
export default function Window({
  onAddMessage,
  threads,
}: {
  onAddMessage: (prompt: string) => void;
  threads: Thread[]; // Active Session object
}) {
  const [userInput, setUserInput] = useState("");

  const handleSend = async () => {
    if (!userInput.trim()) return;
    onAddMessage(userInput.trim());
    setUserInput("");
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Messages Area: Only this area will scroll */}
      <div className="flex-1 overflow-auto mb-4 border p-2 border-white">
        {threads
          .filter((thread) => thread.role !== "system")
          .map((thread: Thread, i: number) => (
            <div key={i} className="mb-2">
              <div
                className={
                  thread.role === "user" ? "text-blue-600" : "text-green-600"
                }
              >
                {thread.role === "user" ? "You" : "AI"}
              </div>
              <div className="whitespace-pre-wrap">
                {thread.content[0].text}
              </div>
            </div>
          ))}
      </div>

      {/* Input Form remains fixed at the bottom */}
      <div className="flex">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="border flex-1 px-2 py-1"
          placeholder="質問を入力..."
        />
        <button
          type="button"
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-1 ml-2 rounded"
        >
          送信
        </button>
      </div>
    </div>
  );
}
