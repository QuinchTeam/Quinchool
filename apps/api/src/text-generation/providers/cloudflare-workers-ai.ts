import { TextGenerationProviderHttpError } from "../errors";
import type { TextGenerationUsage } from "../types";

export interface GenerateCloudflareWorkersAITextParams {
  prompt: string;
  providerModelId: string;
}

export interface GenerateCloudflareWorkersAITextResult {
  providerModelId: string;
  text: string;
  usage?: TextGenerationUsage;
}

interface CloudflareWorkersAIResponse {
  errors?: Array<{ message?: string }>;
  result?: {
    choices?: Array<{ message?: { content?: string } }>;
    response?: string;
    usage?: {
      completion_tokens?: number;
      prompt_tokens?: number;
      total_tokens?: number;
    };
  };
}

function getCloudflareWorkersAIConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

  if (!accountId || !apiToken) {
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be configured",
    );
  }

  return { accountId, apiToken };
}

export async function generateCloudflareWorkersAIText({
  prompt,
  providerModelId,
}: GenerateCloudflareWorkersAITextParams): Promise<GenerateCloudflareWorkersAITextResult> {
  const { accountId, apiToken } = getCloudflareWorkersAIConfig();
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${providerModelId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
      }),
    },
  );
  const body = (await response.json()) as CloudflareWorkersAIResponse;

  if (!response.ok) {
    throw new TextGenerationProviderHttpError({
      message:
        body.errors?.[0]?.message ??
        `Cloudflare Workers AI request failed (${response.status})`,
      status: response.status,
    });
  }

  const text =
    body.result?.choices?.[0]?.message?.content?.trim() ??
    body.result?.response?.trim();

  if (!text) {
    throw new Error("Cloudflare Workers AI returned no text output");
  }

  return {
    providerModelId,
    text,
    usage: {
      inputTokens: body.result?.usage?.prompt_tokens,
      outputTokens: body.result?.usage?.completion_tokens,
      totalTokens: body.result?.usage?.total_tokens,
    },
  };
}
