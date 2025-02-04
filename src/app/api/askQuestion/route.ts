// app/api/askQuestion/route.ts
import {
  Content,
  GenerateContentResult,
  VertexAI,
} from "@google-cloud/vertexai";
import { NextResponse } from "next/server";

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = "us-central1";
const model = "gemini-1.5-flash-001";

const vertexAI = new VertexAI({
  project: projectId,
  location: location,
});

// チャットセッションを保持するためのMap
const chatSessions = new Map();

export async function POST(request: Request) {
  try {
    const { chatId, question } = await request.json();

    if (!projectId) {
      throw new Error("GOOGLE_CLOUD_PROJECT_ID is not set");
    }

    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: model,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.9,
        topP: 1,
      },
    });
    console.dir("🚀 ~ POST ~ generativeModel:", generativeModel);

    // 既存のチャットセッションを取得するか、新しいセッションを作成
    let chat = chatSessions.get(chatId);
    if (!chat) {
      chat = generativeModel.startChat();
      chatSessions.set(chatId, chat);
    }

    // 既存のチャットセッションを使用してメッセージを送信
    const result = (await chat.sendMessage(question)) as GenerateContentResult;
    console.dir("🚀 ~ POST ~ result:", result);
    const response = result.response;
    console.log("🚀 ~ POST ~ response:", response);

    // チャット履歴を取得
    const history = (await chat.getHistory()) as Content[];
    console.dir("🚀 ~ POST ~ history:", history);
    console.dir("🚀 ~ POST ~ response:", JSON.stringify(response));

    return NextResponse.json({
      answer: JSON.stringify(response),
      messageId: chatId,
      history: history,
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    let errorMessage = "AI処理中にエラーが発生しました";

    if (error instanceof Error) {
      errorMessage = `エラー: ${error.message}`;
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
