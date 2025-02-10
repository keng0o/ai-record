"use client";

import pixelmatch from "pixelmatch";
import { useCallback, useEffect, useRef, useState } from "react";

import { postImage, postMessage } from "@/app/actions";
import { addRecord } from "@/lib/firestore";

import { Session } from "@/types";
import Window from "./Window";

/** Configuration constants */
const CAPTURE_CONFIG = {
  THRESHOLD: 0.1,
  MIN_DIFF_PERCENTAGE: 0.01,
} as const;

/**
 * Helper: draw current frame from video to canvas and retrieve ImageData.
 */
function getCanvasImageData(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): ImageData | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Helper: stop all media tracks in the given video element.
 */
function stopMediaTracks(video: HTMLVideoElement) {
  if (video.srcObject instanceof MediaStream) {
    video.srcObject.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  }
}

/**
 * Main component that handles:
 * 1) Screen capture & difference checking.
 * 2) Session session creation and message handling.
 */
export default function ClientHome({
  uid,
  session,
}: {
  uid: string;
  session: Session;
}) {
  const [capturing, setCapturing] = useState(false);
  const [paused, setPaused] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousImageDataRef = useRef<ImageData | null>(null);

  /**
   * Cleanup on unmount: stop capture if still running.
   */
  useEffect(() => {
    return () => {
      handleStopCapture();
    };
  }, []);

  /**
   * Compare two ImageData objects and check if there's a significant difference.
   */
  const checkSignificantDiff = (
    oldData: ImageData | null,
    newData: ImageData
  ): boolean => {
    if (!oldData) return true;
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

  /**
   * Capture a single screenshot and, if there is a significant difference,
   * send it to the server for AI-based extraction.
   */
  const captureScreenshot = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log("Video not ready yet...");
      return;
    }

    const newImageData = getCanvasImageData(video, canvas);
    if (!newImageData) return;

    if (checkSignificantDiff(previousImageDataRef.current, newImageData)) {
      const image = canvas.toDataURL("image/png");

      const result = await postImage({ image });
      await addRecord(uid, {
        date: result.date.toISOString(),
        reply: result.reply,
      });
    }
    previousImageDataRef.current = newImageData;
  }, [uid]);

  /**
   * Start repeated capture at a fixed interval.
   */
  useEffect(() => {
    if (!capturing || !videoRef.current) return;

    const intervalId = setInterval(() => {
      if (!paused) {
        void captureScreenshot();
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [capturing, paused, captureScreenshot]);

  /**
   * Handle the start of a screen capture.
   */
  const handleStartCapture = async () => {
    if (capturing) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      previousImageDataRef.current = null;

      if (!videoRef.current) {
        throw new Error("Video element not found");
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setCapturing(true);
      setPaused(false);
    } catch (err) {
      console.error("Error starting capture:", err);
      alert("画面キャプチャの開始に失敗しました");
    }
  };

  /**
   * Stop capturing entirely.
   */
  const handleStopCapture = () => {
    setCapturing(false);
    setPaused(false);

    if (videoRef.current) {
      stopMediaTracks(videoRef.current);
    }
  };

  const handleAddMessage = async (prompt: string) => {
    const response = await postMessage({
      uid,
      sessionId: session.id,
      prompt,
    });
    console.log("🚀 ~ handleAddMessage ~ response:", response);
  };

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
              onClick={handleStartCapture}
            >
              記録を開始
            </button>
          </>
        )}
      </div>
      <div className="flex-1 flex flex-col">
        <Window
          onAddMessage={handleAddMessage}
          threads={session.threads.main}
        />
      </div>
    </div>
  );
}
