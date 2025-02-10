"use client";

import { useState } from "react";

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

interface ChatWindowProps {
  onAddMessage: (prompt: string) => void;
}

// interface HistoryMessage {
//   role: "user" | "ai";
//   parts: { text: string }[];
// }

export default function ChatWindow({ onAddMessage }: ChatWindowProps) {
  const [userInput, setUserInput] = useState("");
  // const [chatHistory, setChatHistory] = useState<HistoryMessage[]>([]);

  const handleSend = async () => {
    if (!userInput.trim()) return;
    onAddMessage(userInput.trim());

    try {
      // const res = await fetch("/api/askQuestion", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ chatId: chat.id, question: userInput }),
      // });
      // const data = await res.json();
      // const aiMsg: Message = {
      //   role: "ai",
      //   content: data.answer,
      //   timestamp: new Date().toISOString(),
      // };
      // onAddMessage(chat.id, aiMsg);
      // if (data.history) {
      //   setChatHistory(data.history);
      // }
    } catch (error) {
      console.error("Error in askQuestion:", error);
    }

    setUserInput("");
  };

  return (
    <div className="flex flex-col flex-1 p-4">
      {/* Messages */}
      <div className="flex-1 overflow-auto mb-4 border p-2">
        {/* {chat.messages.map((msg, i) => (
          <div key={i} className="mb-2">
            <div
              className={
                msg.role === "user" ? "text-blue-600" : "text-green-600"
              }
            >
              {msg.role === "user" ? "You" : "AI"}
            </div>
            <div>{msg.content}</div>
          </div>
        ))} */}

        {/* {chatHistory.map((msg, i) => (
          <div key={`history-${i}`} className="mb-2 text-gray-600">
            <div>{msg.role === "user" ? "You" : "AI"} (履歴)</div>
            <div>{msg.parts[0]?.text || ""}</div>
          </div>
        ))} */}
      </div>

      {/* Input Form */}
      <div className="flex">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          className="border flex-1 px-2 py-1"
          placeholder="質問を入力..."
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-1 ml-2 rounded"
        >
          送信
        </button>
      </div>
    </div>
  );
}
