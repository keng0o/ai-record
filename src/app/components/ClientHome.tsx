"use client";

import { Chat, Message } from "@/types";
import pixelmatch from "pixelmatch";
import { useEffect, useRef, useState } from "react";
import { uploadImage } from "../actions"; // "use server" な関数
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";

const CAPTURE_CONFIG = {
  THRESHOLD: 0.1,
  MIN_DIFF_PERCENTAGE: 0.01,
} as const;

export default function ClientHome() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  // グローバルに画像を持っているが、本来はチャットごとに紐付けるのが望ましい
  const [images, setImages] = useState<string[]>([]);

  // キャプチャ関連
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previousImageData, setPreviousImageData] = useState<ImageData | null>(
    null
  );

  // --------------------------------------------------------------------------
  // ローカルストレージから読み込み
  // --------------------------------------------------------------------------
  useEffect(() => {
    const savedChats = localStorage.getItem("chats");
    const savedActiveChatId = localStorage.getItem("activeChatId");
    if (savedChats) {
      setChats(JSON.parse(savedChats));
    }
    if (savedActiveChatId) {
      setActiveChatId(savedActiveChatId);
    }
  }, []);

  // --------------------------------------------------------------------------
  // ローカルストレージへの保存
  // --------------------------------------------------------------------------
  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
    if (activeChatId) {
      localStorage.setItem("activeChatId", activeChatId);
    }
  }, [chats, activeChatId]);

  // --------------------------------------------------------------------------
  // アンマウント時のクリーンアップ: キャプチャ停止
  // --------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      stopCapture(); // アンマウント時にはアップロードしないように例示 (必要に応じてtrueに)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------------------------------
  // キャプチャ停止 (オプションで画像アップロード)
  // --------------------------------------------------------------------------
  const stopCapture = async () => {
    setIsCapturing(false);
    setIsPaused(false);

    // MediaStream を停止
    if (videoRef.current?.srcObject instanceof MediaStream) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    console.log("アップロード対象の画像枚数:", images.length);
    if (images.length) {
      try {
        const res = await uploadImage(images);
        console.log("🚀 ~ stopCapture ~ VertexAI generateContent:", res);
      } catch (e) {
        console.error("画像アップロードに失敗:", e);
      }
    }
  };

  // --------------------------------------------------------------------------
  // 差分判定
  // --------------------------------------------------------------------------
  const compareImages = (newImageData: ImageData): boolean => {
    // 初回は必ず保存
    if (!previousImageData) {
      return true;
    }
    // 画像サイズが異なる場合は強制保存
    if (
      previousImageData.width !== newImageData.width ||
      previousImageData.height !== newImageData.height
    ) {
      return true;
    }

    const width = newImageData.width;
    const height = newImageData.height;
    const diffOutput = new Uint8Array(width * height * 4);

    const numDiffPixels = pixelmatch(
      previousImageData.data,
      newImageData.data,
      diffOutput,
      width,
      height,
      {
        threshold: CAPTURE_CONFIG.THRESHOLD,
        includeAA: true,
        alpha: 0.1,
        diffColor: [255, 0, 0],
      }
    );

    const totalPixels = width * height;
    const diffPercentage = numDiffPixels / totalPixels;
    const shouldSave = diffPercentage >= CAPTURE_CONFIG.MIN_DIFF_PERCENTAGE;
    return shouldSave;
  };

  // --------------------------------------------------------------------------
  // スクリーンショットを再帰的に撮り続ける
  // --------------------------------------------------------------------------
  const takeScreenshot = async () => {
    if (!videoRef.current || !isCapturing) return;

    const video = videoRef.current;

    // ビデオの準備ができているか確認
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      // まだ映像が来ていない場合、少し待って再実行
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
      setPreviousImageData(newImageData);

      if (hasSufficientDiff) {
        const dataUrl = canvas.toDataURL("image/png");
        setImages((prev) => [...prev, dataUrl]);
      }

      // 1秒後に再度撮影
      if (isCapturing && !isPaused) {
        setTimeout(() => takeScreenshot(), 1000);
      }
    } catch (error) {
      console.error("画像の比較中にエラー:", error);
      // エラーが発生しても撮影を続ける
      if (isCapturing && !isPaused) {
        setTimeout(() => takeScreenshot(), 1000);
      }
    }
  };

  // --------------------------------------------------------------------------
  // 新しいチャットを作成 + キャプチャ開始
  // --------------------------------------------------------------------------
  const handleNewChat = async () => {
    if (isCapturing) return; // すでにキャプチャ中なら何もしない

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // 明示的にvideoを指定
      });
      console.log("🚀 ~ handleNewChat ~ stream:", stream);

      // キャプチャ開始前に画像リスト・差分状態をリセット
      setImages([]);
      setPreviousImageData(null);

      // Video要素にストリームをセットし、再生
      if (!videoRef.current) {
        console.log("🚀 ~ handleNewChat ~ videoRef:", videoRef);
        throw new Error("Video element not found");
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      console.log("🚀 ~ handleNewChat ~ videoRef:", videoRef);

      // キャプチャ開始フラグを立てる
      setIsCapturing(true);
      setIsPaused(false);

      // スクリーンショットの再帰撮影開始
      console.log("🚀 ~ handleNewChat ~ takeScreenshot");
      takeScreenshot();
    } catch (err) {
      console.error("Error starting capture:", err);
      alert("画面キャプチャの開始に失敗しました");
    }
  };

  // --------------------------------------------------------------------------
  // アクティブチャットを取得
  // --------------------------------------------------------------------------
  const activeChat = chats.find((c) => c.id === activeChatId);

  // --------------------------------------------------------------------------
  // メッセージ追加
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // JSX レンダリング
  // --------------------------------------------------------------------------
  return (
    <div className="flex h-full">
      {/* キャプチャ中のみ video要素をレンダリングする（不要なら常時OK） */}
      <video ref={videoRef} autoPlay style={{ display: "none" }} muted />

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
              onClick={() => stopCapture()} // trueでアップロード実行
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
