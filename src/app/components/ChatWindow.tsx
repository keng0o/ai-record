"use client";

import { Chat } from "@/types";
import { useState } from "react";

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

interface ChatWindowProps {
  chat: Chat;
  images: string[];
  onAddMessage: (chatId: string, msg: Message) => void;
}

export default function ChatWindow({
  chat,
  images,
  onAddMessage,
}: ChatWindowProps) {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  const handleSend = async () => {
    if (!userInput.trim()) return;

    // 1. ユーザーのメッセージを追加
    const userMsg: Message = {
      role: "user",
      content: userInput,
      timestamp: new Date().toISOString(),
    };
    onAddMessage(chat.id, userMsg);

    // 2. APIを呼び出してAI応答を取得
    try {
      const res = await fetch("/api/askQuestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: chat.id,
          question: userInput,
        }),
      });
      const data = await res.json();
      console.log("🚀 ~ handleSend ~ data:", data);

      // 3. AIメッセージを追加
      const aiMsg: Message = {
        role: "ai",
        content: data.answer,
        timestamp: new Date().toISOString(),
      };
      onAddMessage(chat.id, aiMsg);

      // 4. チャット履歴を更新
      if (data.history) {
        setChatHistory(data.history);
      }
    } catch (error) {
      console.error("Error in askQuestion:", error);
    }

    setUserInput("");
  };

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* スクリーンショット一覧 (サムネ表示) */}
      <div className="flex overflow-x-auto mb-4 space-x-2">
        {images.map((image, i) => (
          <img
            key={i}
            src={image}
            alt={`Screenshot-${i}`}
            className="w-24 h-24 object-cover border"
          />
        ))}
      </div>

      {/* メッセージ表示 */}
      <div className="flex-1 overflow-auto mb-4 border p-2">
        {/* ローカルのメッセージ履歴 */}
        {chat.messages.map((msg, i) => (
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
        ))}

        {/* Vertex AIのチャット履歴 */}
        {chatHistory.map((msg, i) => (
          <div key={`history-${i}`} className="mb-2 text-gray-600">
            <div>{msg.role === "user" ? "You" : "AI"} (履歴)</div>
            <div>{msg.parts[0].text}</div>
          </div>
        ))}
      </div>

      {/* 入力フォーム */}
      <div className="flex">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
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
