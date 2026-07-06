import { getProviderModelId } from "@/lib/config/text-generation-models";
import { generateOpenAIText } from "@/lib/services/openai-text";
import { mapTextGenerationProviderError } from "@/lib/text-generation/errors";
import type {
  GenerateTextResult,
  ProviderGenerateTextParams,
  TextGenerationProviderAdapter,
} from "@/lib/text-generation/types";
import { TEXT_GENERATION_PROVIDER_IDS } from "@/lib/text-generation/types";

export const openAITextGenerationAdapter: TextGenerationProviderAdapter = {
  async generateText({
    modelId,
    prompt,
  }: ProviderGenerateTextParams): Promise<GenerateTextResult> {
    const providerModelId = getProviderModelId({
      modelId,
      providerId: TEXT_GENERATION_PROVIDER_IDS.OPENAI,
    });

    try {
      const result = await generateOpenAIText({ prompt, providerModelId });

      return {
        modelId,
        providerId: TEXT_GENERATION_PROVIDER_IDS.OPENAI,
        providerModelId: result.providerModelId,
        text: result.text,
      };
    } catch (error) {
      throw mapTextGenerationProviderError({
        error,
        providerId: TEXT_GENERATION_PROVIDER_IDS.OPENAI,
        providerModelId,
      });
    }
  },
};
