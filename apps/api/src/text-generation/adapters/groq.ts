import { mapTextGenerationProviderError } from "../errors";
import { getProviderModelId } from "../models";
import { generateGroqText } from "../providers/groq";
import type {
  GenerateTextResult,
  ProviderGenerateTextParams,
  TextGenerationProviderAdapter,
} from "../types";
import { TEXT_GENERATION_PROVIDER_IDS } from "../types";

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
        usage: result.usage,
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
