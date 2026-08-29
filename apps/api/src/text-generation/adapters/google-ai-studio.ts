import { mapTextGenerationProviderError } from "../errors";
import { getProviderModelId } from "../models";
import { generateGoogleText } from "../providers/google-ai-studio";
import type {
  GenerateTextResult,
  ProviderGenerateTextParams,
  TextGenerationProviderAdapter,
} from "../types";
import { TEXT_GENERATION_PROVIDER_IDS } from "../types";

export const googleAIStudioTextGenerationAdapter: TextGenerationProviderAdapter =
  {
    providerId: TEXT_GENERATION_PROVIDER_IDS.GOOGLE_AI_STUDIO,
    async generateText({
      modelId,
      prompt,
    }: ProviderGenerateTextParams): Promise<GenerateTextResult> {
      const providerModelId = getProviderModelId({
        modelId,
        providerId: TEXT_GENERATION_PROVIDER_IDS.GOOGLE_AI_STUDIO,
      });

      try {
        const result = await generateGoogleText({ prompt, providerModelId });

        return {
          modelId,
          providerId: TEXT_GENERATION_PROVIDER_IDS.GOOGLE_AI_STUDIO,
          providerModelId: result.providerModelId,
          text: result.text,
          usage: result.usage,
        };
      } catch (error) {
        throw mapTextGenerationProviderError({
          error,
          providerId: TEXT_GENERATION_PROVIDER_IDS.GOOGLE_AI_STUDIO,
          providerModelId,
        });
      }
    },
  };
