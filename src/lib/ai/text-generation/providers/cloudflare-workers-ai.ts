import { TextGenerationProviderHttpError } from "@/lib/ai/text-generation/errors";

export interface GenerateCloudflareWorkersAITextParams {
  prompt: string;
  providerModelId: string;
}

export interface GenerateCloudflareWorkersAITextResult {
  providerModelId: string;
  text: string;
}

interface CloudflareWorkersAIResponse {
  errors?: Array<{ message?: string }>;
  result?: {
    choices?: Array<{ message?: { content?: string } }>;
    response?: string;
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

  return { providerModelId, text };
}
