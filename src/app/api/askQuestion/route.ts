// app/api/askQuestion/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { chatId, question } = await request.json();

    console.log("🚀 ~ POST ~ chatId:", chatId);
    // ここで Vertex AI(Gemini) に質問を送って回答を取得する
    // 例:
    // const aiResponse = await fetch('https://vertexapi.googleapis.com/v1/images:askQuestion', {...});
    // const aiData = await aiResponse.json();

    // ダミー応答
    const answer = `「${question}」に対するAIのサンプル回答です。`;

    return NextResponse.json({ answer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
