import { mapTextGenerationProviderError } from "@/lib/ai/text-generation/errors";
import { getProviderModelId } from "@/lib/ai/text-generation/models";
import { generateGoogleText } from "@/lib/ai/text-generation/providers/google-ai-studio";
import type {
  GenerateTextResult,
  ProviderGenerateTextParams,
  TextGenerationProviderAdapter,
} from "@/lib/ai/text-generation/types";
import { TEXT_GENERATION_PROVIDER_IDS } from "@/lib/ai/text-generation/types";

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
