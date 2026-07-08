import { GoogleGenAI } from "@google/genai";

let googleClient: GoogleGenAI | null = null;

export interface GenerateGoogleTextParams {
  prompt: string;
  providerModelId: string;
}

export interface GenerateGoogleTextResult {
  providerModelId: string;
  text: string;
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
  throw new Error("Force Stop");
  // biome-ignore lint/correctness/noUnreachable: Forced stop kept for local testing.
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
  };
}
