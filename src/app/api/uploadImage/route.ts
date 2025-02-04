// app/api/uploadImage/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { images } = await request.json();

    console.log("🚀 ~ POST ~ images:", images);
    // ここで Vertex AI(Gemini) の画像解析APIを呼ぶなどの処理を行う
    // 例:
    // const response = await fetch('https://vertexapi.googleapis.com/v1/images:analyze', {...});
    // const result = await response.json();

    // サンプルとしてOKを返す
    return NextResponse.json({ success: true, message: "Images uploaded" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
