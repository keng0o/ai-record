"use client";

import { Chat, Message } from "@/types";
import pixelmatch from "pixelmatch";
import { useEffect, useRef, useState } from "react";
import { uploadImage } from "../actions";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";

const CAPTURE_CONFIG = {
  THRESHOLD: 0.1,
  MIN_DIFF_PERCENTAGE: 0.01,
} as const;

// localStorageのアクセスをクライアントサイドのみに制限するカスタムフック
function useLocalStorage<T>(key: string, initialValue: T) {
  // 初期値を設定する関数
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // 値を保存する関数
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

export default function ClientHome() {
  // localStorageの使用をカスタムフックに置き換え
  const [chats, setChats] = useLocalStorage<Chat[]>("chats", []);
  const [activeChatId, setActiveChatId] = useLocalStorage<string | null>(
    "activeChatId",
    null
  );
  const [images, setImages] = useState<string[]>([]);

  const [isCapturing, setIsCapturing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [previousImageData, setPreviousImageData] = useState<ImageData | null>(
    null
  );

  // クライアントサイドでのマウント完了を検知
  useEffect(() => {
    setIsClient(true);
  }, []);

  // コンポーネントの初期化
  useEffect(() => {
    // ローカルストレージからデータを復元
    const savedChats = localStorage.getItem("chats");
    const savedActiveChatId = localStorage.getItem("activeChatId");

    if (savedChats) {
      setChats(JSON.parse(savedChats));
    }
    if (savedActiveChatId) {
      setActiveChatId(savedActiveChatId);
    }
  }, []);

  // 状態が変更されたときにローカルストレージに保存
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("chats", JSON.stringify(chats));
      if (activeChatId) {
        localStorage.setItem("activeChatId", activeChatId);
      }
    }
  }, [chats, activeChatId, isClient]);

  // コンポーネントがアンマウントされるときに必ずキャプチャを停止
  useEffect(() => {
    return () => {
      stopCapture();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCapture = async () => {
    setIsCapturing(false);
    setIsPaused(false);

    if (videoRef.current?.srcObject instanceof MediaStream) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    try {
      if (images.length > 0) {
        const res = await uploadImage(images);
        console.log("🚀 ~ stopCapture ~ res:", res);

        const newChat: Chat = {
          id: `chat-${Date.now()}`,
          messages: [],
          startAt: new Date().toISOString(),
        };
        setChats((prev) => [...prev, newChat]);
        setActiveChatId(newChat.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const compareImages = (newImageData: ImageData): boolean => {
    // 初回の撮影時は必ず保存
    if (!previousImageData) {
      console.log("初回の撮影なので保存します");
      return true;
    }

    // 画像サイズが異なる場合は差分ありとみなす
    if (
      previousImageData.width !== newImageData.width ||
      previousImageData.height !== newImageData.height
    ) {
      console.log("画像サイズが異なるため保存します");
      return true;
    }

    const width = newImageData.width;
    const height = newImageData.height;

    const diffOutput = new Uint8Array(width * height * 4); // RGBA用のバッファ

    const numDiffPixels = pixelmatch(
      previousImageData.data,
      newImageData.data,
      diffOutput,
      width,
      height,
      {
        threshold: CAPTURE_CONFIG.THRESHOLD,
        includeAA: true, // アンチエイリアスを含める
        alpha: 0.1, // アルファ値の重み
        diffColor: [255, 0, 0], // 差分を赤色で表示
      }
    );

    const totalPixels = width * height;
    const diffPercentage = numDiffPixels / totalPixels;

    console.log(`差分ピクセル数: ${numDiffPixels}`);
    console.log(`総ピクセル数: ${totalPixels}`);

    const shouldSave = diffPercentage >= CAPTURE_CONFIG.MIN_DIFF_PERCENTAGE;
    console.log(
      shouldSave ? "差分が十分あるため保存します" : "差分が小さいため破棄します"
    );

    return shouldSave;
  };

  const takeScreenshot = async () => {
    if (!videoRef.current || !isCapturing) return;

    const video = videoRef.current;

    // ビデオの準備ができているか確認
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (isCapturing && !isPaused) {
        setTimeout(() => takeScreenshot(), 1000);
      }
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hasSufficientDiff = compareImages(newImageData);
      console.log(
        "🚀 ~ takeScreenshot ~ hasSufficientDiff:",
        hasSufficientDiff
      );
      setPreviousImageData(newImageData);

      if (hasSufficientDiff) {
        const dataUrl = canvas.toDataURL("image/png");
        console.log("🚀 ~ takeScreenshot ~ dataUrl:", dataUrl);
        setImages((prev) => [...prev, dataUrl]);
      }

      // 再帰的に次のスクリーンショットを1秒後に取得
      if (isCapturing && !isPaused) {
        setTimeout(() => takeScreenshot(), 1000);
      }
    } catch (error) {
      console.error("画像の比較中にエラーが発生しました:", error);
      // エラーが発生しても再度呼び出す
      if (isCapturing && !isPaused) {
        setTimeout(() => takeScreenshot(), 1000);
      }
    }
  };

  // 新しいチャットを作成しつつキャプチャ開始
  const handleNewChat = async () => {
    if (isCapturing) return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      setImages([]);
      setPreviousImageData(null);

      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      const newChat: Chat = {
        id: `chat-${Date.now()}`,
        messages: [],
        startAt: new Date().toISOString(),
      };

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setChats((prev) => [...prev, newChat]);
      setActiveChatId(newChat.id);
      setIsCapturing(true);
      setIsPaused(false);

      takeScreenshot();
    } catch (err) {
      console.error("Error starting capture:", err);
      alert("画面キャプチャの開始に失敗しました");
    }
  };

  // アクティブチャットを取得
  const activeChat = chats.find((c) => c.id === activeChatId);

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

  // レンダリング部分を条件付きで表示
  if (!isClient) {
    return (
      <div className="flex h-full justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {isCapturing && (
        <video ref={videoRef} autoPlay style={{ display: "none" }} muted />
      )}
      {/* サイドバー */}
      <div className="w-64 bg-gray-200 p-4 space-y-2">
        {isCapturing ? (
          <>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-4 py-2 rounded bg-yellow-500 text-white w-full"
            >
              {isPaused ? "再開" : "一時停止"}
            </button>
            <button
              onClick={() => stopCapture()}
              className="px-4 py-2 rounded bg-red-500 text-white w-full"
            >
              停止
            </button>
          </>
        ) : (
          <button
            className="bg-blue-500 text-white px-4 py-2 mb-4 rounded w-full"
            onClick={handleNewChat}
          >
            新しいチャット
          </button>
        )}

        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
        />
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <ChatWindow
            chat={activeChat}
            images={images}
            onAddMessage={handleAddMessage}
          />
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
