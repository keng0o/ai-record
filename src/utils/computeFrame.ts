export function computeFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): ImageData {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context not found");
  }

  // video要素のサイズとcanvasのサイズを同じにする
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // 現在のフレームをcanvasに描画
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // そのままImageDataを取得
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
