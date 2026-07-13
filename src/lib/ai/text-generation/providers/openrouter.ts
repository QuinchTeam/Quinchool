import { TextGenerationProviderHttpError } from "@/lib/ai/text-generation/errors";

export interface GenerateOpenRouterTextParams {
  prompt: string;
  providerModelId: string;
}

export interface GenerateOpenRouterTextResult {
  providerModelId: string;
  text: string;
}

interface OpenRouterResponse {
  error?: { message?: string };
  choices?: Array<{ message?: { content?: string } }>;
}

function getOpenRouterApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  return apiKey;
}

export async function generateOpenRouterText({
  prompt,
  providerModelId,
}: GenerateOpenRouterTextParams): Promise<GenerateOpenRouterTextResult> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getOpenRouterApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: providerModelId,
        messages: [{ role: "user", content: prompt }],
      }),
    },
  );
  const body = (await response.json()) as OpenRouterResponse;

  if (!response.ok) {
    throw new TextGenerationProviderHttpError({
      message:
        body.error?.message ?? `OpenRouter request failed (${response.status})`,
      status: response.status,
    });
  }

  const text = body.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("OpenRouter returned no text output");
  }

  return { providerModelId, text };
}
