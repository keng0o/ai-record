"use client";

import { useEffect, useState } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";
import ScreenshotCapture from "./ScreenshotCapture";

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

interface Chat {
  id: string;
  title: string;
  screenshots: string[]; // Base64 のスクショを格納する例
  messages: Message[];
}

export default function ClientHome() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // 初回ロード時に localStorage からチャット履歴を読み込み
  useEffect(() => {
    const stored = localStorage.getItem("chats");
    if (stored) {
      setChats(JSON.parse(stored));
    }
  }, []);

  // chats が更新されるたび localStorage に保存
  useEffect(() => {
    // localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  // 新しいチャットを作成
  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `Chat at ${new Date().toLocaleTimeString()}`,
      screenshots: [],
      messages: [],
    };
    setChats([...chats, newChat]);
    setActiveChatId(newChat.id);
  };

  // アクティブチャットを取得
  const activeChat = chats.find((c) => c.id === activeChatId);

  // スクリーンショット保存
  const handleSaveScreenshot = (chatId: string, dataUrl: string) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === chatId) {
          return { ...chat, screenshots: [...chat.screenshots, dataUrl] };
        }
        return chat;
      })
    );
  };

  // メッセージ追加
  const handleAddMessage = (chatId: string, msg: Message) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === chatId) {
          return { ...chat, messages: [...chat.messages, msg] };
        }
        return chat;
      })
    );
  };

  // 停止ボタンを押したときの処理 (例: API呼び出しでまとめて解析)
  const handleStopAndProcess = async () => {
    // 必要があれば、撮りためたスクリーンショットをAPI経由でAIに送る
    try {
      await fetch("/api/uploadImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: chats.map((c) => c.screenshots) }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-full">
      {/* サイドバー */}
      <div className="w-64 bg-gray-200 p-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 mb-4 rounded w-full"
          onClick={handleNewChat}
        >
          新しいチャット
        </button>
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
        />
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col">
        {/* スクリーンショットキャプチャ */}
        {activeChatId && (
          <ScreenshotCapture
            chatId={activeChatId}
            onSaveScreenshot={handleSaveScreenshot}
            onStopAndProcess={handleStopAndProcess}
          />
        )}
        {/* チャットウィンドウ */}
        {activeChat ? (
          <ChatWindow chat={activeChat} onAddMessage={handleAddMessage} />
        ) : (
          <div className="flex-1 flex justify-center items-center">
            <p className="text-gray-500">
              チャットを選択、または作成してください
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
