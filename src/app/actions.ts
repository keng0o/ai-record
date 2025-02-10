"use server";

import { ai } from "@/lib/aiConfig";
import { createLocalSessionStore } from "@/lib/localSessionStore";

import { getReords } from "@/lib/firestore";

export async function postImage({ image }: { image: string }) {
  const now = new Date();

  // 4) チャットを送信
  const chat = ai.chat();
  const prompt = `[指示]
スクリーンショットを添付します。

これらのスクリーンショットに写っている情報をすべて抽出し、以下の点に注意して、事実に基づいた詳細なレポートを作成してください。

1. 各スクリーンショットに写っている情報を網羅的に記述する。
2. 情報源（スクリーンショットのファイル名）を明記する。
3. 機密事項や個人情報が含まれる場合は、適切に伏せる。

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

// async function getSession(sessionId: string | undefined, uid: string) {
//   const store = createLocalSessionStore(uid);
//   if (sessionId) {
//     const session = await ai.loadSession(sessionId, { store });
//     return session;
//   } else {
//     const session = ai.createSession({
//       store,
//     });
//     return session;
//   }
// }

// async function getAIChat(sessionId: string | undefined, uid: string) {
//   const records = await getReords(uid);
//   const session = await getSession(sessionId, uid);
//   if (sessionId) {
//     return session.chat();
//   } else {
//     return session.chat({
//       system: `私の過去の記録です。${JSON.stringify(records)}`,
//     });
//   }
// }

export async function createSession(uid: string) {
  const store = createLocalSessionStore(uid);

  const session = ai.createSession({
    store,
  });
  const records = await getReords(uid);
  const chat = session.chat({
    system: `私の過去の記録です。${JSON.stringify(records)}`,
  });
  await chat.send("過去の記録の要約をしてください");
  return session.id;
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
  const now = new Date();
  // 4) チャットを送信
  const store = createLocalSessionStore(uid);
  const session = await ai.loadSession(sessionId, { store });
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
