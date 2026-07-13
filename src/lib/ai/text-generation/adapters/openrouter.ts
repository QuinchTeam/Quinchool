import { mapTextGenerationProviderError } from "@/lib/ai/text-generation/errors";
import { getProviderModelId } from "@/lib/ai/text-generation/models";
import { generateOpenRouterText } from "@/lib/ai/text-generation/providers/openrouter";
import type {
  GenerateTextResult,
  ProviderGenerateTextParams,
  TextGenerationProviderAdapter,
} from "@/lib/ai/text-generation/types";
import { TEXT_GENERATION_PROVIDER_IDS } from "@/lib/ai/text-generation/types";

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
