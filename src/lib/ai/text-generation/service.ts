import { DEFAULT_TEXT_GENERATION_MODEL_ID } from "@/lib/ai/text-generation/models";
import { getTextGenerationProviderChain } from "@/lib/ai/text-generation/provider-chain";
import type {
  GenerateTextParams,
  GenerateTextResult,
} from "@/lib/ai/text-generation/types";

export async function generateText({
  modelId = DEFAULT_TEXT_GENERATION_MODEL_ID,
  prompt,
}: GenerateTextParams): Promise<GenerateTextResult> {
  const providerChain = getTextGenerationProviderChain(modelId);
  let lastError: unknown;

  for (const adapter of providerChain) {
    console.info("Text generation provider:", adapter.providerId);

    try {
      return await adapter.generateText({ modelId, prompt });
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(`Text generation failed for model: ${modelId}`);
}
