import { mapTextGenerationProviderError } from "../errors";
import { getProviderModelId } from "../models";
import { generateCloudflareWorkersAIText } from "../providers/cloudflare-workers-ai";
import type {
  GenerateTextResult,
  ProviderGenerateTextParams,
  TextGenerationProviderAdapter,
} from "../types";
import { TEXT_GENERATION_PROVIDER_IDS } from "../types";

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
          usage: result.usage,
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
