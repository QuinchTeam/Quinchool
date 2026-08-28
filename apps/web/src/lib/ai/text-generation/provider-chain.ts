import { cloudflareWorkersAITextGenerationAdapter } from "@/lib/ai/text-generation/adapters/cloudflare-workers-ai";
import { googleAIStudioTextGenerationAdapter } from "@/lib/ai/text-generation/adapters/google-ai-studio";
import { groqTextGenerationAdapter } from "@/lib/ai/text-generation/adapters/groq";
import { openRouterTextGenerationAdapter } from "@/lib/ai/text-generation/adapters/openrouter";
import { getTextGenerationModelConfig } from "@/lib/ai/text-generation/models";
import type {
  TextGenerationModelId,
  TextGenerationProviderAdapter,
  TextGenerationProviderId,
} from "@/lib/ai/text-generation/types";
import { TEXT_GENERATION_PROVIDER_IDS } from "@/lib/ai/text-generation/types";

const TEXT_GENERATION_ADAPTERS: Record<
  TextGenerationProviderId,
  TextGenerationProviderAdapter
> = {
  [TEXT_GENERATION_PROVIDER_IDS.GOOGLE_AI_STUDIO]:
    googleAIStudioTextGenerationAdapter,
  [TEXT_GENERATION_PROVIDER_IDS.CLOUDFLARE_WORKERS_AI]:
    cloudflareWorkersAITextGenerationAdapter,
  [TEXT_GENERATION_PROVIDER_IDS.OPENROUTER]: openRouterTextGenerationAdapter,
  [TEXT_GENERATION_PROVIDER_IDS.GROQ]: groqTextGenerationAdapter,
};

export function getTextGenerationProviderChain(
  modelId: TextGenerationModelId,
): TextGenerationProviderAdapter[] {
  const { providerModels } = getTextGenerationModelConfig(modelId);
  const chain = (Object.keys(providerModels) as TextGenerationProviderId[]).map(
    (providerId) => TEXT_GENERATION_ADAPTERS[providerId],
  );

  if (!chain.length) {
    throw new Error(
      `No text-generation providers configured for model: ${modelId}`,
    );
  }

  return chain;
}
