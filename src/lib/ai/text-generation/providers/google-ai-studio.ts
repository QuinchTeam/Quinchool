import { GoogleGenAI } from "@google/genai";
import type { TextGenerationUsage } from "@/lib/ai/text-generation/types";

let googleClient: GoogleGenAI | null = null;

export interface GenerateGoogleTextParams {
  prompt: string;
  providerModelId: string;
}

export interface GenerateGoogleTextResult {
  providerModelId: string;
  text: string;
  usage?: TextGenerationUsage;
}

function getGoogleClient() {
  if (!googleClient) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    googleClient = new GoogleGenAI({ apiKey });
  }

  return googleClient;
}

export async function generateGoogleText({
  prompt,
  providerModelId,
}: GenerateGoogleTextParams): Promise<GenerateGoogleTextResult> {
  const response = await getGoogleClient().models.generateContent({
    model: providerModelId,
    contents: prompt,
  });

  const text = response.text ?? "";

  if (!text) {
    throw new Error("Google AI Studio returned no text output");
  }

  return {
    providerModelId,
    text,
    usage: {
      inputTokens: response.usageMetadata?.promptTokenCount,
      outputTokens: response.usageMetadata?.candidatesTokenCount,
      totalTokens: response.usageMetadata?.totalTokenCount,
    },
  };
}
