import { mapTextGenerationProviderError } from "../errors";
import { getProviderModelId } from "../models";
import { generateOpenRouterText } from "../providers/openrouter";
import type {
  GenerateTextResult,
  ProviderGenerateTextParams,
  TextGenerationProviderAdapter,
} from "../types";
import { TEXT_GENERATION_PROVIDER_IDS } from "../types";

export const openRouterTextGenerationAdapter: TextGenerationProviderAdapter = {
  providerId: TEXT_GENERATION_PROVIDER_IDS.OPENROUTER,
  async generateText({
    modelId,
    prompt,
  }: ProviderGenerateTextParams): Promise<GenerateTextResult> {
    const providerModelId = getProviderModelId({
      modelId,
      providerId: TEXT_GENERATION_PROVIDER_IDS.OPENROUTER,
    });

    try {
      const result = await generateOpenRouterText({
        prompt,
        providerModelId,
      });

      return {
        modelId,
        providerId: TEXT_GENERATION_PROVIDER_IDS.OPENROUTER,
        providerModelId: result.providerModelId,
        text: result.text,
        usage: result.usage,
      };
    } catch (error) {
      throw mapTextGenerationProviderError({
        error,
        providerId: TEXT_GENERATION_PROVIDER_IDS.OPENROUTER,
        providerModelId,
      });
    }
  },
};
