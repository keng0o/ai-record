"use server";

// app/api/uploadImage/route.ts
import { gemini15Flash, vertexAI } from "@genkit-ai/vertexai";
import { genkit } from "genkit";
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = "asia-northeast1";
const model = "gemini-1.5-flash-001";

// const vertexAI = new VertexAI({
//   project: projectId,
//   location: location,
// });
// const generativeModel = vertexAI.preview.getGenerativeModel({
//   model: model,
//   generationConfig: {
//     maxOutputTokens: 2048,
//     temperature: 0.9,
//     topP: 1,
//   },
// });

// export async function uploadImage(images: string[]) {
//   if (!images.length) return;

//   try {
//     const response = (await generativeModel.generateContent({
//       contents: [
//         {
//           role: "user",
//           parts: images.map((image) => {
//             const base64Body = image.replace(/^data:image\/\w+;base64,/, "");
//             return {
//               inlineData: {
//                 data: base64Body,
//                 mimeType: "image/png",
//               },
//             };
//           }),
//         },
//       ],
//     })) as GenerateContentResult;
//     // Wait for the response to complete
//     const aggregatedResponse = await response.response;
//     console.log("🚀 ~ POST ~ aggregatedResponse:", aggregatedResponse);
//     return {
//       success: true,
//       response: JSON.parse(JSON.stringify(aggregatedResponse)),
//     };
//     //   const bytes = await file.arrayBuffer();
//     //   const buffer = Buffer.from(bytes);

//     //   // 保存先のディレクトリを作成
//     //   const uploadDir = path.join(process.cwd(), "public", "uploads");
//     //   const imagePath = path.join(uploadDir, `${Date.now()}.png`);

//     //   // 新しい画像を保存
//     //   await writeFile(imagePath, buffer);

//     //   return NextResponse.json({ success: true });
//   } catch (error) {
//     console.log("🚀 ~ POST ~ error:", error);
//     return {
//       success: false,
//       error: "画像のアップロードに失敗しました",
//     };
//   }
// }

export async function test() {
  const ai = genkit({
    plugins: [vertexAI({ location, projectId })],
  });

  // make a generation request
  const result = await ai.generate({
    model: gemini15Flash,
    prompt: "What should I do when I visit Melbourne?",
  });
  console.log(result);

  return result;
}
