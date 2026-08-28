import { TextGenerationProviderHttpError } from "@/lib/ai/text-generation/errors";
import type { TextGenerationUsage } from "@/lib/ai/text-generation/types";

export interface GenerateGroqTextParams {
  prompt: string;
  providerModelId: string;
}

export interface GenerateGroqTextResult {
  providerModelId: string;
  text: string;
  usage?: TextGenerationUsage;
}

interface GroqResponse {
  error?: { message?: string };
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    completion_tokens?: number;
    prompt_tokens?: number;
    total_tokens?: number;
  };
}

function getGroqApiKey() {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  return apiKey;
}

export async function generateGroqText({
  prompt,
  providerModelId,
}: GenerateGroqTextParams): Promise<GenerateGroqTextResult> {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getGroqApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: providerModelId,
        messages: [{ role: "user", content: prompt }],
      }),
    },
  );
  const body = (await response.json()) as GroqResponse;

  if (!response.ok) {
    throw new TextGenerationProviderHttpError({
      message:
        body.error?.message ?? `Groq request failed (${response.status})`,
      status: response.status,
    });
  }

  const text = body.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("Groq returned no text output");
  }

  return {
    providerModelId,
    text,
    usage: {
      inputTokens: body.usage?.prompt_tokens,
      outputTokens: body.usage?.completion_tokens,
      totalTokens: body.usage?.total_tokens,
    },
  };
}
