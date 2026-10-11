import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";
import type { TextGenerationValues } from "@/lib/ai/text-generation/validations";
import { apiUrl, withCredentials } from "@/lib/api";
import { apiFetch, observeOperation } from "@/lib/observability/operation";

export type PromptEnhancerInput = {
  modelId: TextGenerationModelId;
  prompt: string;
};

export type PromptEnhancerResult = {
  enhancedPrompt: string;
};

export type TextGenerationResult = {
  text: string;
};

export async function enhancePrompt(
  input: PromptEnhancerInput,
): Promise<PromptEnhancerResult> {
  return observeOperation("prompt-enhancer.request", async () => {
    const response = await apiFetch(apiUrl("/prompt-enhancer"), {
      ...withCredentials,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await response.json()) as PromptEnhancerResult & {
      error?: string;
    };

    if (!response.ok) {
      throw Object.assign(new Error(data.error ?? "Failed to enhance prompt"), {
        status: response.status,
      });
    }

    return data;
  });
}

export async function generateText(
  input: TextGenerationValues,
): Promise<TextGenerationResult> {
  return observeOperation("text-generation.request", async () => {
    const response = await apiFetch(apiUrl("/text-generation"), {
      ...withCredentials,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await response.json()) as TextGenerationResult & {
      error?: string;
    };

    if (!response.ok) {
      throw Object.assign(new Error(data.error ?? "Failed to generate text"), {
        status: response.status,
      });
    }

    return data;
  });
}
