"use server";

import { ai } from "@/utils/aiConfig";
import type { MySessionState } from "@/utils/localSessionStore";
import { createLocalSessionStore } from "@/utils/localSessionStore";

import fs from "fs/promises";
import path from "path";

export interface ChatResult {
  reply: string;
  sessionId: string;
  uploadedImagePaths: string[];
}

/**
 * サーバーアクション: チャットを行う
 * "use server" をつけることで、クライアントから呼ばれた際にサーバーで実行される
 */
export async function chatAction(formData: FormData): Promise<ChatResult> {
  // 1) フォームから取得
  const sessionId = (formData.get("sessionId") as string) || "";
  const message = (formData.get("message") as string) || "";
  // 複数ファイルを取り出す
  const images = formData.getAll("images") as File[];

  // 2) 画像をローカル保存
  const uploadedPaths: string[] = [];
  for (const file of images) {
    // 画像バイナリを読み込む
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ファイル名はユニークにする
    const dir = path.join(process.cwd(), "uploads");
    await fs.mkdir(dir, { recursive: true });
    const uniqueName = `${Date.now()}_${file.name}`;
    const filePath = path.join(dir, uniqueName);

    // 書き込み
    await fs.writeFile(filePath, buffer);
    uploadedPaths.push(filePath);
  }

  // 3) セッションをロード or 新規作成
  const store = createLocalSessionStore();
  let session = await ai.loadSession(sessionId, { store });
  if (!session) {
    session = ai.createSession<MySessionState>({ store });
  }

  // 4) チャットを送信
  const chat = session.chat();
  const userPrompt = `
ユーザー入力:
${message}

アップロード画像パス:
${uploadedPaths.map((p) => `- ${p}`).join("\n")}
  `.trim();

  const response = await chat.send(userPrompt);

  return {
    reply: response.text,
    sessionId: session.id,
    uploadedImagePaths: uploadedPaths,
  };
}

export async function postImage({ image }: { image: string }) {
  const now = new Date();

  // 4) チャットを送信
  const chat = ai.chat();
  const prompt = `[指示]
スクリーンショットを添付します。

これらのスクリーンショットに写っている情報をすべて抽出し、以下の点に注意して、事実に基づいた詳細なレポートを作成してください。

1. 各スクリーンショットに写っている情報を網羅的に記述する。
2. 情報源（スクリーンショットのファイル名）を明記する。
3. 異なるスクリーンショットに同一の情報が記載されている場合は、重複を避けて簡潔にまとめる。
4. 情報が矛盾する場合は、それぞれの情報を併記し、矛盾点を指摘する。
5. 必要に応じて、情報の背景や意味合いを考察する。
6. 機密事項や個人情報が含まれる場合は、適切に伏せる。

  撮影日時: ${now.toLocaleDateString()}
  `.trim();

  const response = await chat.send([
    {
      media: {
        contentType: "image/png",
        url: image,
      },
    },
    { text: prompt },
  ]);

  return {
    reply: response.text,
    date: now,
  };
}

export async function postMessage({
  uid,
  sessionId,
  prompt,
}: {
  uid: string;
  sessionId: string;
  prompt: string;
}) {
  const store = createLocalSessionStore(uid);

  const now = new Date();

  let session = await ai.loadSession(sessionId, { store });
  if (!session) {
    session = ai.createSession<MySessionState>({
      store,
      initialState: {
        date: now.toISOString(),
        reply: "",
      },
    });
  }

  // 4) チャットを送信
  const sessionChat = session.chat();

  const response = await sessionChat.send(
    `あなたは、過去の時系列の日記データに基づいて、ユーザーの質問に答えるAIです。

## 日記データ
session情報をもとに

## 指示

1. ユーザーからの質問を受け取ります。
2. 質問内容を理解し、日記データの中から関連する情報を検索します。
3. 関連する情報に基づいて、質問に対する回答を生成します。
4. 回答は、事実に基づいた正確なものである必要があります。
5. 回答は、ユーザーにとって分かりやすく、丁寧な言葉遣いである必要があります。
6. 回答の中で、日記データからの引用を適切に行うようにしてください。
7. 質問内容によっては、複数の日記データを参照する必要がある場合があります。
8. 質問内容によっては、回答が困難な場合があります。その場合は、「この質問にはお答えできません」と回答してください。

## ユーザーからの質問
${prompt}
  `.trim()
  );

  return {
    reply: response.text,
    sessionId: session.id,
    date: now,
  };
}
