import { mapTextGenerationProviderError } from "@/lib/ai/text-generation/errors";
import { getProviderModelId } from "@/lib/ai/text-generation/models";
import { generateGroqText } from "@/lib/ai/text-generation/providers/groq";
import type {
  GenerateTextResult,
  ProviderGenerateTextParams,
  TextGenerationProviderAdapter,
} from "@/lib/ai/text-generation/types";
import { TEXT_GENERATION_PROVIDER_IDS } from "@/lib/ai/text-generation/types";

export const groqTextGenerationAdapter: TextGenerationProviderAdapter = {
  providerId: TEXT_GENERATION_PROVIDER_IDS.GROQ,
  async generateText({
    modelId,
    prompt,
  }: ProviderGenerateTextParams): Promise<GenerateTextResult> {
    const providerModelId = getProviderModelId({
      modelId,
      providerId: TEXT_GENERATION_PROVIDER_IDS.GROQ,
    });

    try {
      const result = await generateGroqText({ prompt, providerModelId });

      return {
        modelId,
        providerId: TEXT_GENERATION_PROVIDER_IDS.GROQ,
        providerModelId: result.providerModelId,
        text: result.text,
      };
    } catch (error) {
      throw mapTextGenerationProviderError({
        error,
        providerId: TEXT_GENERATION_PROVIDER_IDS.GROQ,
        providerModelId,
      });
    }
  },
};
