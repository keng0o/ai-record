"use client";

import { useEffect, useRef, useState } from "react";

interface ScreenshotCaptureProps {
  chatId: string;
  onSaveScreenshot: (chatId: string, dataUrl: string) => void;
  onStopAndProcess: () => void;
}

export default function ScreenshotCapture({
  chatId,
  onSaveScreenshot,
  onStopAndProcess,
}: ScreenshotCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [intervalSec, setIntervalSec] = useState(5);

  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // コンポーネントがアンマウントされた時にはキャプチャを停止
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, []);

  const startCapture = async () => {
    if (isCapturing) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      streamRef.current = stream;
      setIsCapturing(true);
      setIsPaused(false);

      // ビデオタグにストリームを設定 (映像を取得)
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      console.log("🚀 ~ startCapture ~ videoRef:", videoRef);

      // インターバルでスクリーンショットを撮る
      captureIntervalRef.current = setInterval(() => {
        console.log(
          "🚀 ~aa captureIntervalRef.current=setInterval ~ isPaused:",
          isPaused
        );
        takeScreenshot();
      }, intervalSec * 1000);
    } catch (err) {
      console.error("Error starting capture:", err);
    }
  };

  // 停止ボタンを押したときの処理 (例: API呼び出しでまとめて解析)
  const onClickStopButton = async () => {
    stopCapture();
    onStopAndProcess();
  };

  const pauseCapture = () => {
    setIsPaused(true);
  };

  const resumeCapture = () => {
    setIsPaused(false);
  };

  const stopCapture = () => {
    setIsCapturing(false);
    setIsPaused(false);
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const takeScreenshot = () => {
    if (!videoRef.current) return;
    console.log("🚀 ~ takeScreenshot ~ videoRef:", videoRef);
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    console.log("🚀 ~ takeScreenshot ~ dataUrl:", dataUrl);

    // 親コンポーネントへスクショを渡す
    onSaveScreenshot(chatId, dataUrl);
  };

  return (
    <div className="p-2 border-b flex items-center space-x-2">
      {/* このvideo要素は画面表示には隠していますが、キャプチャ用として裏で利用 */}
      <video ref={videoRef} autoPlay style={{ display: "none" }} />
      <label>間隔(秒): </label>
      <input
        type="number"
        value={intervalSec}
        onChange={(e) => setIntervalSec(Number(e.target.value))}
        className="w-20 border px-2"
        min={1}
      />

      <div className="flex items-center space-x-4 mb-2">
        <button
          onClick={startCapture}
          disabled={isCapturing}
          className={`px-4 py-2 rounded ${
            isCapturing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 text-white"
          }`}
        >
          開始
        </button>
        {isCapturing && (
          <>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-4 py-2 rounded bg-yellow-500 text-white"
            >
              {isPaused ? "再開" : "一時停止"}
            </button>
            <button
              onClick={() => {
                stopCapture();
                onStopAndProcess();
              }}
              className="px-4 py-2 rounded bg-red-500 text-white"
            >
              停止
            </button>
          </>
        )}
        <div className="flex items-center">
          <span className="mr-2">間隔:</span>
          <input
            type="number"
            value={intervalSec}
            onChange={(e) => setIntervalSec(Number(e.target.value))}
            className="w-20 px-2 py-1 border rounded"
            min="1"
          />
          <span className="ml-1">秒</span>
        </div>
      </div>
    </div>
  );
}
