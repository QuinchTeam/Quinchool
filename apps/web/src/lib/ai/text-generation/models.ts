import type {
  TextGenerationModelId,
  TextGenerationProviderId,
} from "@/lib/ai/text-generation/types";
import {
  TEXT_GENERATION_MODEL_IDS,
  TEXT_GENERATION_PROVIDER_IDS,
} from "@/lib/ai/text-generation/types";

export const DEFAULT_TEXT_GENERATION_MODEL_ID =
  TEXT_GENERATION_MODEL_IDS.GEMINI_3_5_FLASH_LITE;

export interface TextGenerationModelConfig {
  description: string;
  id: TextGenerationModelId;
  name: string;
  providerModels: Partial<Record<TextGenerationProviderId, string>>;
}

export const TEXT_GENERATION_MODELS = [
  {
    id: TEXT_GENERATION_MODEL_IDS.GEMINI_3_6_FLASH,
    name: "Gemini 3.6 Flash",
    description:
      "Google's most capable free Flash model for agentic and coding tasks.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.GOOGLE_AI_STUDIO]: "gemini-3.6-flash",
    },
  },
  {
    id: TEXT_GENERATION_MODEL_IDS.GEMINI_3_5_FLASH_LITE,
    name: "Gemini 3.5 Flash-Lite",
    description: "Cheapest, fastest current-generation Gemini model.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.GOOGLE_AI_STUDIO]: "gemini-3.5-flash-lite",
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
    id: TEXT_GENERATION_MODEL_IDS.QWEN_3_8_27B,
    name: "Qwen 3.8 27B",
    description: "Open-weight all-rounder from Alibaba for chat and reasoning.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.GROQ]: "qwen/qwen3.8-27b",
      [TEXT_GENERATION_PROVIDER_IDS.CLOUDFLARE_WORKERS_AI]:
        "@cf/qwen/qwen3.8-27b",
    },
  },
  {
    id: TEXT_GENERATION_MODEL_IDS.NORTH_MINI_CODE,
    name: "Cohere North Mini Code",
    description: "Compact Cohere model tuned for coding tasks.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.OPENROUTER]: "cohere/north-mini-code:free",
    },
  },
  {
    id: TEXT_GENERATION_MODEL_IDS.GPT_OSS_20B,
    name: "GPT-OSS 20B",
    description: "Fast open-weight reasoning model.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.GROQ]: "openai/gpt-oss-20b",
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
