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

      // インターバルでスクリーンショットを撮る
      captureIntervalRef.current = setInterval(() => {
        if (!isPaused) {
          takeScreenshot();
        }
      }, intervalSec * 1000);
    } catch (err) {
      console.error("Error starting capture:", err);
    }
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
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");

    // 親コンポーネントへスクショを渡す
    onSaveScreenshot(chatId, dataUrl);
  };

  // 停止ボタンを押したときの処理 (例: API呼び出しでまとめて解析)
  const onClickStopButton = async () => {
    stopCapture();
    onStopAndProcess();
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

      {!isCapturing && (
        <button
          className="bg-green-500 text-white px-3 py-1 rounded"
          onClick={startCapture}
        >
          開始
        </button>
      )}
      {isCapturing && !isPaused && (
        <button
          className="bg-yellow-500 text-white px-3 py-1 rounded"
          onClick={pauseCapture}
        >
          一時停止
        </button>
      )}
      {isCapturing && isPaused && (
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded"
          onClick={resumeCapture}
        >
          再開
        </button>
      )}
      {isCapturing && (
        <button
          className="bg-red-500 text-white px-3 py-1 rounded"
          onClick={onClickStopButton}
        >
          停止
        </button>
      )}
    </div>
  );
}
