import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";
import type { TextGenerationValues } from "@/lib/validations/text-generation";

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
  const response = await fetch("/api/prompt-enhancer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as PromptEnhancerResult & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to enhance prompt");
  }

  return data;
}

export async function generateText(
  input: TextGenerationValues,
): Promise<TextGenerationResult> {
  const response = await fetch("/api/text-generation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as TextGenerationResult & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to generate text");
  }

  return data;
}
