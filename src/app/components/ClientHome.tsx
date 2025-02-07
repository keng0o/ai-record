"use client";

import { Chat, Message } from "@/types";
import { storage } from "@/utils/clientApp";
import { getDownloadURL } from "firebase/storage";
import pixelmatch from "pixelmatch";
import { useEffect, useRef, useState } from "react";
import { uploadImage } from "../actions"; // "use server" な関数
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";

import { ref as storageRef, uploadBytes } from "firebase/storage";

const CAPTURE_CONFIG = {
  THRESHOLD: 0.1,
  MIN_DIFF_PERCENTAGE: 0.01,
} as const;

const delay = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export default function ClientHome() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  // グローバルに画像を持っているが、本来はチャットごとに紐付けるのが望ましい
  const [images, setImages] = useState<string[]>([]);

  // --------------------------------------------------------------------------
  // キャプチャ関連
  // --------------------------------------------------------------------------
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // ★ setTimeout のタイマーIDを保持するための useRef
  const captureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Video / Canvas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 前フレームの ImageData
  const previousImageDataRef = useRef<ImageData | null>(null);

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
  // アンマウント時のクリーンアップ: キャプチャ停止 + clearTimeout
  // --------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      stopCapture();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------------------------------
  // フレームを Firebase へアップロード
  // --------------------------------------------------------------------------
  const uploadFrameToFirebase = async (canvas: HTMLCanvasElement) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const timestamp = new Date().getTime();
      // 例: frames/frame_{timestamp}.png というパスに保存
      const imageRef = storageRef(storage, `frames/frame_${timestamp}.png`);

      try {
        // BlobをFirebase Storageにアップロード
        await uploadBytes(imageRef, blob);
        // アップロード後のダウンロードURLを取得して表示
        const url = await getDownloadURL(imageRef);
        console.log("Uploaded!", url);
        setUploadedUrls((prev) => [...prev, url]);
      } catch (error) {
        console.error("Upload failed", error);
      }
    }, "image/png");
  };

  // --------------------------------------------------------------------------
  // 差分判定
  // --------------------------------------------------------------------------
  const hasSignificantDiff = (
    oldData: ImageData | null,
    newData: ImageData
  ): boolean => {
    // 前フレームがない場合（初回）は必ず true
    if (!oldData) return true;

    // 解像度が変わったら強制的に true
    if (oldData.width !== newData.width || oldData.height !== newData.height) {
      return true;
    }

    const { width, height } = newData;
    const diffOutput = new Uint8Array(width * height * 4);

    const numDiffPixels = pixelmatch(
      oldData.data,
      newData.data,
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
    const diffRatio = numDiffPixels / totalPixels;
    return diffRatio >= CAPTURE_CONFIG.MIN_DIFF_PERCENTAGE;
  };

  // --------------------------------------------------------------------------
  // スクリーンショットを再帰的に撮り続ける
  // --------------------------------------------------------------------------
  const takeScreenshot = async () => {
    console.log("Taking screenshot... isPaused:", isPaused);
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 映像がまだ取得できていない (幅や高さが 0) 場合はリトライ
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log("Video not ready, retrying in 1s...");
    } else {
      // Canvas サイズ調整 + 描画
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 新しい ImageData を取得して差分判定
      const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (hasSignificantDiff(previousImageDataRef.current, newImageData)) {
        console.log("Saving image...");
        uploadFrameToFirebase(canvas);
      } else {
        console.log("No significant difference, skipping capture");
      }
      previousImageDataRef.current = newImageData;
    }

    await delay(10000);
    await takeScreenshot();
  };

  // --------------------------------------------------------------------------
  // キャプチャ開始
  // --------------------------------------------------------------------------
  const startCapture = async () => {
    if (isCapturing || isPaused) return; // すでにキャプチャ中なら何もしない

    try {
      console.log("Requesting display media...");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // 明示的にvideoを指定
      });

      // キャプチャ開始前に画像リスト・差分状態をリセット
      setImages([]);
      previousImageDataRef.current = null;

      // Video要素にストリームをセットし、再生
      if (!videoRef.current) {
        throw new Error("Video element not found");
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      console.log("Display media stream started:", stream);

      setIsCapturing(true);
      setIsPaused(false);

      // スクリーンショット開始
      await takeScreenshot();
    } catch (err) {
      console.error("Error starting capture:", err);
      alert("画面キャプチャの開始に失敗しました");
    }
  };

  // --------------------------------------------------------------------------
  // キャプチャ停止
  // --------------------------------------------------------------------------
  const stopCapture = async () => {
    console.log("stopCapture called");
    // captureTimeoutRef が残っていれば clear
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = null;
    }

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
  // アクティブチャットを取得 (本来は startCapture 時にチャット作成するなど)
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
      {/* キャプチャ用 canvas (表示はしない) */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* キャプチャ中のプレビュー用 video (必要に応じて表示/非表示) */}
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
              onClick={stopCapture}
              className="px-4 py-2 rounded bg-red-500 text-white w-full"
            >
              停止
            </button>
          </>
        ) : (
          <button
            className="bg-blue-500 text-white px-4 py-2 mb-4 rounded w-full"
            onClick={startCapture}
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
        {uploadedUrls.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h2>Uploaded Frames</h2>
            {uploadedUrls.map((url) => (
              <div key={url} style={{ marginBottom: 10 }}>
                <img src={url} alt="Uploaded frame" width={240} />
              </div>
            ))}
          </div>
        )}
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
