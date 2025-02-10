"use server";

import { ai } from "@/lib/aiConfig";
import { createLocalSessionStore } from "@/lib/localSessionStore";

import { getReords } from "@/lib/firestore";

export async function postImage({ image }: { image: string }) {
  const now = new Date();

  // 4) チャットを送信
  const chat = ai.chat();
  const prompt = `[指示]
スクリーンショットをに写っている情報をすべて抽出してください。感想や意見を含めないようにしてください。出力は情報だけにしてください。日本語で出力してください。

1.情報を網羅的に記述する。
2.機密事項や個人情報が含まれる場合は、適切に伏せる。
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
    date: now.toISOString(),
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
    system: `記録です。${JSON.stringify(records)}`,
  });
  await chat.send("記録を要約をしてください");
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
    `あなたは、過去の記録に基づいて、ユーザーの質問に答えるAIです。
## 指示

1. ユーザーからの質問を受け取ります。
2. 質問内容を理解し、記録の中から関連する情報を検索します。
3. 関連する情報に基づいて、質問に対する回答を生成します。
4. 回答は、事実に基づいた正確なものである必要があります。
5. 回答の中で、記録からの引用を適切に行うようにしてください。

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
