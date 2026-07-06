import { DEFAULT_TEXT_GENERATION_MODEL_ID } from "@/lib/config/text-generation-models";
import { getTextGenerationProviderChain } from "@/lib/text-generation/provider-chain";
import type {
  GenerateTextParams,
  GenerateTextResult,
} from "@/lib/text-generation/types";

export async function generateText({
  modelId = DEFAULT_TEXT_GENERATION_MODEL_ID,
  prompt,
}: GenerateTextParams): Promise<GenerateTextResult> {
  const providerChain = getTextGenerationProviderChain(modelId);
  let lastError: unknown;

  for (const adapter of providerChain) {
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
