// app/aiConfig.ts
import vertexAI, { gemini15Pro } from "@genkit-ai/vertexai";
import { genkit } from "genkit";

export const ai = genkit({
  plugins: [vertexAI({ location: "asia-east1" })],
  model: gemini15Pro,
});
