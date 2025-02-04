// app/api/askQuestion/route.ts
import { VertexAI } from "@google-cloud/vertexai";
import { NextResponse } from "next/server";

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = "us-central1";
const model = "gemini-pro";

const vertexAI = new VertexAI({
  project: projectId,
  location: location,
});

// チャットセッションを保持するためのMap
const chatSessions = new Map();

export async function POST(request: Request) {
  try {
    const { chatId, question } = await request.json();

    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: model,
      generation_config: {
        max_output_tokens: 2048,
        temperature: 0.9,
        top_p: 1,
      },
    });

    // 既存のチャットセッションを取得するか、新しいセッションを作成
    let chat = chatSessions.get(chatId);
    if (!chat) {
      chat = generativeModel.startChat();
      chatSessions.set(chatId, chat);
    }

    // 既存のチャットセッションを使用してメッセージを送信
    const result = await chat.sendMessage(question);
    const response = result.response;

    // チャット履歴を取得
    const history = await chat.getHistory();

    return NextResponse.json({
      answer: response.text(),
      messageId: response.messageId,
      history: history,
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return NextResponse.json(
      { message: "AI処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
