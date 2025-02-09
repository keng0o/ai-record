"use client";

import pixelmatch from "pixelmatch";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { Chat } from "@/types";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";
// import { chatWithAI } from "@/app/actions";
import { postImage, postMessage } from "@/app/actions";
import { addRecord, createLocalSessionStore } from "@/utils/firestore";

const CAPTURE_CONFIG = {
  THRESHOLD: 0.1,
  MIN_DIFF_PERCENTAGE: 0.01,
} as const;

export default function ClientHome({
  sessions,
  uid,
}: {
  sessions: { date: string }[];
  uid: string;
}) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(uuidv4());

  const [capturing, setCapturing] = useState(false);
  const [paused, setPaused] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousImageDataRef = useRef<ImageData | null>(null);
  const store = createLocalSessionStore(uid);
  console.log("🚀 ~ store:", store);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      handleStopCapture();
    };
  }, []);

  /**
   * Compare two ImageData objects and check if there's a significant difference
   */
  const checkSignificantDiff = (
    oldData: ImageData | null,
    newData: ImageData
  ): boolean => {
    if (!oldData) return true;
    if (oldData.width !== newData.width || oldData.height !== newData.height)
      return true;

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

  /**
   * Capture a single screenshot and post if there's a significant difference
   */
  const captureScreenshot = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log("Video not ready yet...");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (checkSignificantDiff(previousImageDataRef.current, newImageData)) {
      const image = canvas.toDataURL("image/png");
      setCapturedImages((prev) => [...prev, image]);
      const result = await postImage({ image });
      console.log("Image posted:", result.reply);
      await addRecord(uid, {
        date: result.date.toISOString(),
        reply: result.reply,
      });
    } else {
      console.log("No significant difference detected. Skipping.");
    }
    previousImageDataRef.current = newImageData;
  }, [currentSessionId]);

  /**
   * Start repeated capture using setInterval
   */
  useEffect(() => {
    if (!capturing || !videoRef.current) return;

    const intervalId = setInterval(() => {
      if (paused) {
        console.log("Capture paused.");
        return;
      }
      captureScreenshot();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [capturing, paused, captureScreenshot]);

  /**
   * Handle start capturing
   */
  const handleStartCapture = async () => {
    if (capturing) return;

    try {
      console.log("Requesting display media...");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      // Reset before capturing
      setCapturedImages([]);
      previousImageDataRef.current = null;

      if (!videoRef.current) throw new Error("Video element not found");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setCapturing(true);
      setPaused(false);
    } catch (err) {
      console.error("Error starting capture:", err);
      alert("画面キャプチャの開始に失敗しました");
    }
  };

  const handleSessionChat = async () => {
    const sessionId = uuidv4();
    setActiveChatId(sessionId);
    const newChat: Chat = {
      id: sessionId,
      messages: [],
    };
    setChats((prev) => [...prev, newChat]);
  };

  /**
   * Handle stop capturing
   */
  const handleStopCapture = async () => {
    console.log("Stopping capture...");
    setCapturing(false);
    setPaused(false);
    setCurrentSessionId("");

    if (videoRef.current?.srcObject instanceof MediaStream) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  /**
   * Add a new message to a specific chat
   */
  const handleAddMessage = async (prompt: string) => {
    if (!activeChatId) return;
    const response = await postMessage({
      uid,
      sessionId: activeChatId,
      prompt,
    });
    console.log("🚀 ~ handleAddMessage ~ response:", response);
    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === activeChatId) {
          // return { ...chat, messages: [...chat.messages, msg] };
        }
        return chat;
      })
    );
  };

  /**
   * Identify the active chat object
   */
  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="flex h-full">
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <video ref={videoRef} autoPlay style={{ display: "none" }} muted />

      {/* Sidebar */}
      <div className="w-64 bg-gray-200 p-4 space-y-2">
        {capturing ? (
          <>
            <button
              onClick={() => setPaused((prev) => !prev)}
              className="px-4 py-2 rounded bg-yellow-500 text-white w-full"
            >
              {paused ? "再開" : "一時停止"}
            </button>
            <button
              onClick={handleStopCapture}
              className="px-4 py-2 rounded bg-red-500 text-white w-full"
            >
              停止
            </button>
          </>
        ) : (
          <>
            <button
              className="bg-blue-500 text-white px-4 py-2 mb-4 rounded w-full"
              onClick={handleSessionChat}
            >
              記録の振り返り
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 mb-4 rounded w-full"
              onClick={handleStartCapture}
            >
              記録を開始
            </button>
          </>
        )}

        <ChatSidebar
          sessions={sessions}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <ChatWindow onAddMessage={handleAddMessage} />
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
