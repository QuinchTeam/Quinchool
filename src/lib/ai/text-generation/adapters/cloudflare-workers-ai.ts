import { mapTextGenerationProviderError } from "@/lib/ai/text-generation/errors";
import { getProviderModelId } from "@/lib/ai/text-generation/models";
import { generateCloudflareWorkersAIText } from "@/lib/ai/text-generation/providers/cloudflare-workers-ai";
import type {
  GenerateTextResult,
  ProviderGenerateTextParams,
  TextGenerationProviderAdapter,
} from "@/lib/ai/text-generation/types";
import { TEXT_GENERATION_PROVIDER_IDS } from "@/lib/ai/text-generation/types";

export const cloudflareWorkersAITextGenerationAdapter: TextGenerationProviderAdapter =
  {
    providerId: TEXT_GENERATION_PROVIDER_IDS.CLOUDFLARE_WORKERS_AI,
    async generateText({
      modelId,
      prompt,
    }: ProviderGenerateTextParams): Promise<GenerateTextResult> {
      const providerModelId = getProviderModelId({
        modelId,
        providerId: TEXT_GENERATION_PROVIDER_IDS.CLOUDFLARE_WORKERS_AI,
      });

      try {
        const result = await generateCloudflareWorkersAIText({
          prompt,
          providerModelId,
        });

        return {
          modelId,
          providerId: TEXT_GENERATION_PROVIDER_IDS.CLOUDFLARE_WORKERS_AI,
          providerModelId: result.providerModelId,
          text: result.text,
        };
      } catch (error) {
        throw mapTextGenerationProviderError({
          error,
          providerId: TEXT_GENERATION_PROVIDER_IDS.CLOUDFLARE_WORKERS_AI,
          providerModelId,
        });
      }
    },
  };
