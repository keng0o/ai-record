// app/api/uploadImage/route.ts
import { writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: "画像が見つかりません",
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 保存先のディレクトリを作成
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const imagePath = path.join(uploadDir, `${Date.now()}.png`);

    // 新しい画像を保存
    await writeFile(imagePath, buffer);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "画像のアップロードに失敗しました",
    });
  }
}
