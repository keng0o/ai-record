"use client";

import html2canvas from "html2canvas";
import pixelmatch from "pixelmatch";
import { useEffect, useRef, useState } from "react";

interface ScreenshotCaptureProps {
  chatId: string;
  onSaveScreenshot: (chatId: string, dataUrl: string) => void;
  onStopAndProcess: () => void;
  onScreenshotTaken?: () => void;
}

// 差分の閾値（0-1の範囲、小さいほど厳密）
const THRESHOLD = 0.1;
const MIN_DIFF_PERCENTAGE = 0.01; // 最小差分比率（1%）

export default function ScreenshotCapture({
  chatId,
  onSaveScreenshot,
  onStopAndProcess,
  onScreenshotTaken,
}: ScreenshotCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [intervalSec, setIntervalSec] = useState(5);

  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  const [previousImageData, setPreviousImageData] = useState<ImageData | null>(
    null
  );

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
        if (!isPaused) {
          // 一時停止中でない場合のみスクリーンショットを撮影
          takeScreenshot();
        }
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
        threshold: THRESHOLD,
        includeAA: true, // アンチエイリアスを含める
        alpha: 0.1, // アルファ値の重み
        diffColor: [255, 0, 0], // 差分を赤色で表示
      }
    );

    const totalPixels = width * height;
    const diffPercentage = numDiffPixels / totalPixels;

    console.log(`差分ピクセル数: ${numDiffPixels}`);
    console.log(`総ピクセル数: ${totalPixels}`);
    console.log(`差分比率: ${(diffPercentage * 100).toFixed(2)}%`);

    const shouldSave = diffPercentage >= MIN_DIFF_PERCENTAGE;
    console.log(
      shouldSave ? "差分が十分あるため保存します" : "差分が小さいため破棄します"
    );

    return shouldSave;
  };

  const takeScreenshot = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // ビデオの準備ができているか確認
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.log("ビデオデータが準備できていません");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    console.log("🚀 ~ takeScreenshot ~ ctx:", ctx);
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // 新しい画像のImageDataを取得
      const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // 画像を比較
      const hasSufficientDiff = compareImages(newImageData);

      if (!hasSufficientDiff) {
        console.log("前回の画像と差分が小さすぎます");
        return;
      }

      // 現在の画像を保存
      setPreviousImageData(newImageData);

      const dataUrl = canvas.toDataURL("image/png");
      onSaveScreenshot(chatId, dataUrl);
    } catch (error) {
      console.error("画像の比較中にエラーが発生しました:", error);
    }
  };

  const handleScreenshot = async () => {
    try {
      setIsCapturing(true);
      const canvas = await html2canvas(targetRef.current!);
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/png");
      });

      const formData = new FormData();
      formData.append("file", blob, "screenshot.png");

      const response = await fetch("/api/uploadImage", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        // エラーメッセージを表示
        alert(result.error);
        return;
      }

      // 成功時の処理
      onScreenshotTaken && onScreenshotTaken();
    } catch (error) {
      console.error("スクリーンショットの取得に失敗しました:", error);
      alert("スクリーンショットの取得に失敗しました");
    } finally {
      setIsCapturing(false);
    }
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
