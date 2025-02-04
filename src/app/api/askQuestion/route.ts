// app/api/askQuestion/route.ts
import { AppError, handleApiError } from "@/utils/error";
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

// 環境変数のバリデーション
const validateEnvVars = () => {
  const requiredVars = ["GOOGLE_CLOUD_PROJECT_ID"] as const;
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
};

// チャットセッション管理の改善
const chatSessionManager = {
  sessions: new Map(),

  getOrCreateSession(chatId: string, generativeModel: any) {
    if (!this.sessions.has(chatId)) {
      this.sessions.set(chatId, generativeModel.startChat());
    }
    return this.sessions.get(chatId);
  },
};

export async function POST(request: Request) {
  try {
    validateEnvVars(); // 環境変数のバリデーションを最初に実行

    const { chatId, question } = await request.json();
    if (!chatId || !question) {
      throw new AppError(
        "必要なパラメータが不足しています",
        "INVALID_PARAMS",
        400
      );
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
    let chat = chatSessionManager.getOrCreateSession(chatId, generativeModel);

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
      success: true,
      answer: JSON.stringify(response),
      messageId: chatId,
      history: history,
    });
  } catch (error) {
    return NextResponse.json(handleApiError(error), {
      status: error instanceof AppError ? error.statusCode : 500,
    });
  }
}
