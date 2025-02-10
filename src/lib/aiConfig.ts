// app/aiConfig.ts
import vertexAI, { gemini15Pro } from "@genkit-ai/vertexai";
import { genkit } from "genkit";

export const ai = genkit({
  plugins: [vertexAI()],
  model: gemini15Pro,
});
