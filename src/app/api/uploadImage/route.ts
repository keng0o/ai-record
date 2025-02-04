// app/api/uploadImage/route.ts
import { VertexAI } from "@google-cloud/vertexai";
import { NextResponse } from "next/server";

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = "us-central1";
const model = "gemini-pro-vision";

const vertexAI = new VertexAI({
  project: projectId,
  location: location,
});

// チャットセッションを保持するためのMap
const chatSessions = new Map();

export async function POST(request: Request) {
  try {
    const { images, chatId } = await request.json();

    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: model,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.4,
      },
    });

    // 既存のチャットセッションを取得するか、新しいセッションを作成
    let chat = chatSessions.get(chatId);
    if (!chat) {
      chat = generativeModel.startChat();
      chatSessions.set(chatId, chat);
    }

    const prompt = "これらの画像を分析して、重要なポイントを説明してください。";

    const imageContents = images.map((base64Image: string) => ({
      inlineData: {
        data: base64Image.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: "image/png",
      },
    }));

    // 既存のチャットセッションを使用してメッセージを送信
    const result = await chat.sendMessage({
      role: "user",
      parts: [{ text: prompt }, ...imageContents],
    });

    const response = await result.response;

    return NextResponse.json({
      success: true,
      analysis: response.text(),
      messageId: response.messageId,
    });
  } catch (error) {
    console.error("Error processing images:", error);
    return NextResponse.json(
      { success: false, message: "画像処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
