import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";
import type { TextGenerationValues } from "@/lib/ai/text-generation/validations";
import { apiUrl, readApiData, withCredentials } from "@/lib/api";
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
    const response = await apiFetch(
      apiUrl("/text-generation/prompt-enhancements"),
      {
        ...withCredentials,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    return readApiData<PromptEnhancerResult>(
      response,
      "Failed to enhance prompt",
    );
  });
}

export async function generateText(
  input: TextGenerationValues,
): Promise<TextGenerationResult> {
  return observeOperation("text-generation.request", async () => {
    const response = await apiFetch(apiUrl("/text-generation/generations"), {
      ...withCredentials,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return readApiData<TextGenerationResult>(
      response,
      "Failed to generate text",
    );
  });
}
