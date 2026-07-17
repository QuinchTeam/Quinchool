import type {
  TextGenerationModelId,
  TextGenerationProviderId,
} from "@/lib/ai/text-generation/types";
import {
  TEXT_GENERATION_MODEL_IDS,
  TEXT_GENERATION_PROVIDER_IDS,
} from "@/lib/ai/text-generation/types";

export const DEFAULT_TEXT_GENERATION_MODEL_ID =
  TEXT_GENERATION_MODEL_IDS.GEMINI_3_1_FLASH_LITE;

export interface TextGenerationModelConfig {
  description: string;
  id: TextGenerationModelId;
  name: string;
  providerModels: Partial<Record<TextGenerationProviderId, string>>;
}

export const TEXT_GENERATION_MODELS = [
  {
    id: TEXT_GENERATION_MODEL_IDS.GEMINI_3_5_FLASH,
    name: "Gemini 3.5 Flash",
    description:
      "Google's most capable Flash model for agentic and coding tasks.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.GOOGLE_AI_STUDIO]: "gemini-3.5-flash",
    },
  },
  {
    id: TEXT_GENERATION_MODEL_IDS.GEMINI_3_1_FLASH_LITE,
    name: "Gemini 3.1 Flash-Lite",
    description: "Cheapest, fastest current-generation Gemini model.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.GOOGLE_AI_STUDIO]: "gemini-3.1-flash-lite",
    },
  },
  {
    id: TEXT_GENERATION_MODEL_IDS.GEMMA_4_26B_A4B,
    name: "Gemma 4 26B (A4B)",
    description: "Lighter, faster open-weight Gemma model.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.GOOGLE_AI_STUDIO]: "gemma-4-26b-a4b-it",
      [TEXT_GENERATION_PROVIDER_IDS.OPENROUTER]:
        "google/gemma-4-26b-a4b-it:free",
      [TEXT_GENERATION_PROVIDER_IDS.CLOUDFLARE_WORKERS_AI]:
        "@cf/google/gemma-4-26b-a4b-it",
    },
  },
  {
    id: TEXT_GENERATION_MODEL_IDS.GLM_5_2,
    name: "GLM 5.2",
    description: "Open-weight agentic coding model.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.CLOUDFLARE_WORKERS_AI]:
        "@cf/zai-org/glm-5.2",
    },
  },
  {
    id: TEXT_GENERATION_MODEL_IDS.KIMI_K2_7_CODE,
    name: "Kimi K2.7 Code",
    description: "Open-weight model for agentic coding tasks.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.CLOUDFLARE_WORKERS_AI]:
        "@cf/moonshotai/kimi-k2.7-code",
    },
  },
  {
    id: TEXT_GENERATION_MODEL_IDS.KIMI_K2_6,
    name: "Kimi K2.6",
    description: "Open-weight model for multimodal agentic work.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.CLOUDFLARE_WORKERS_AI]:
        "@cf/moonshotai/kimi-k2.6",
    },
  },
  {
    id: TEXT_GENERATION_MODEL_IDS.GPT_OSS_20B,
    name: "GPT-OSS 20B",
    description: "Fast open-weight reasoning model.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.GROQ]: "openai/gpt-oss-20b",
      [TEXT_GENERATION_PROVIDER_IDS.OPENROUTER]: "openai/gpt-oss-20b:free",
      [TEXT_GENERATION_PROVIDER_IDS.CLOUDFLARE_WORKERS_AI]:
        "@cf/openai/gpt-oss-20b",
    },
  },
] as const satisfies readonly TextGenerationModelConfig[];

export function getTextGenerationModelConfig(
  modelId: TextGenerationModelId,
): TextGenerationModelConfig {
  const config = TEXT_GENERATION_MODELS.find((model) => model.id === modelId);

  if (!config) {
    throw new Error(`Unknown text-generation model: ${modelId}`);
  }

  return config;
}

export function getProviderModelId({
  modelId,
  providerId,
}: {
  modelId: TextGenerationModelId;
  providerId: TextGenerationProviderId;
}): string {
  const providerModelId =
    getTextGenerationModelConfig(modelId).providerModels[providerId];

  if (!providerModelId) {
    throw new Error(
      `No provider model configured for ${modelId} on ${providerId}`,
    );
  }

  return providerModelId;
}
