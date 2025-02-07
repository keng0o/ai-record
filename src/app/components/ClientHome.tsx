"use client";

import { Chat, Message } from "@/types";
import { storage } from "@/utils/clientApp";
import { getDownloadURL } from "firebase/storage";
import pixelmatch from "pixelmatch";
import { useCallback, useEffect, useRef, useState } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";

import { test } from "@/app/actions";
import { ref as storageRef, uploadBytes } from "firebase/storage";

const CAPTURE_CONFIG = {
  THRESHOLD: 0.1,
  MIN_DIFF_PERCENTAGE: 0.01,
} as const;

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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagePartsRef = useRef<
    { mimeType: string | undefined; fileUri: string }[]
  >([]);

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
  // アンマウント時のクリーンアップ
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
    const blob = (await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    )) as Blob | null;

    if (!blob) return;
    const timestamp = new Date().getTime();
    // 例: frames/frame_{timestamp}.png というパスに保存
    const imageRef = storageRef(storage, `frames/frame_${timestamp}.png`);

    try {
      // BlobをFirebase Storageにアップロード
      const uploadResult = await uploadBytes(imageRef, blob);
      const mimeType = uploadResult.metadata.contentType;
      const storageUrl = uploadResult.ref.toString();

      // アップロード後のダウンロードURLを取得
      const url = await getDownloadURL(imageRef);
      console.log("Uploaded!", url);
      setUploadedUrls((prev) => [...prev, url]);
      // Construct the imagePart with the MIME type and the URL.
      const fileData = { mimeType, fileUri: storageUrl };
      imagePartsRef.current.push(fileData);
    } catch (error) {
      console.error("Upload failed", error);
    }
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
  // 「1回だけ」スクリーンショットを撮る関数（差分判定を含む）
  // --------------------------------------------------------------------------
  const captureScreenshotOnce = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 映像がまだ取得できていない
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log("Video not ready yet...");
      return;
    }

    // Canvas サイズ調整 + 描画
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 新しい ImageData を取得して差分判定
    const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (hasSignificantDiff(previousImageDataRef.current, newImageData)) {
      console.log("Significant difference -> Saving image...");
      await uploadFrameToFirebase(canvas);
    } else {
      console.log("No significant difference -> Skip");
    }
    previousImageDataRef.current = newImageData;
  }, []);

  // --------------------------------------------------------------------------
  // `isCapturing` と `isPaused` を監視してキャプチャを繰り返す
  // --------------------------------------------------------------------------
  useEffect(() => {
    // キャプチャしていない場合、あるいはVideo要素が無い場合は何もしない
    if (!isCapturing || !videoRef.current) return;

    // setIntervalで 10秒ごとにチェックする
    const intervalId = setInterval(() => {
      // 一時停止中なら撮らない
      if (isPaused) {
        console.log("Paused... skipping capture");
        return;
      }
      // 一時停止でなければ撮る
      captureScreenshotOnce();
    }, 1000);

    // クリーンアップ時
    return () => {
      clearInterval(intervalId);
    };
  }, [isCapturing, isPaused, captureScreenshotOnce]);

  // --------------------------------------------------------------------------
  // キャプチャ開始
  // --------------------------------------------------------------------------
  const startCapture = async () => {
    if (isCapturing) return; // すでにキャプチャ中なら何もしない

    try {
      console.log("Requesting display media...");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      // 開始前にリセット
      setImages([]);
      previousImageDataRef.current = null;

      if (!videoRef.current) throw new Error("Video element not found");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      console.log("Display media stream started:", stream);

      setIsCapturing(true);
      setIsPaused(false);
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
    setIsCapturing(false);
    setIsPaused(false);

    // MediaStream を停止
    if (videoRef.current?.srcObject instanceof MediaStream) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    const result = await test();
    console.log({ result });
  };

  // --------------------------------------------------------------------------
  // アクティブチャット
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
              onClick={() => setIsPaused((prev) => !prev)}
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
