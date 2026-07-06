import { getProviderModelId } from "@/lib/config/text-generation-models";
import { generateGoogleText } from "@/lib/services/google-text";
import { mapTextGenerationProviderError } from "@/lib/text-generation/errors";
import type {
  GenerateTextResult,
  ProviderGenerateTextParams,
  TextGenerationProviderAdapter,
} from "@/lib/text-generation/types";
import { TEXT_GENERATION_PROVIDER_IDS } from "@/lib/text-generation/types";

export const googleAIStudioTextGenerationAdapter: TextGenerationProviderAdapter =
  {
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
