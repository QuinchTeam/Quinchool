import type {
  TextGenerationModelId,
  TextGenerationProviderId,
} from "@/lib/ai/text-generation/types";
import {
  TEXT_GENERATION_MODEL_IDS,
  TEXT_GENERATION_PROVIDER_IDS,
} from "@/lib/ai/text-generation/types";

export const DEFAULT_TEXT_GENERATION_MODEL_ID =
  TEXT_GENERATION_MODEL_IDS.GPT_5_4_NANO;

export interface TextGenerationModelConfig {
  description: string;
  id: TextGenerationModelId;
  name: string;
  providerModels: Partial<Record<TextGenerationProviderId, string>>;
}

export const TEXT_GENERATION_MODELS = [
  {
    id: TEXT_GENERATION_MODEL_IDS.GPT_5_4_NANO,
    name: "GPT-5.4 Nano",
    description: "Cheapest OpenAI text model.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.OPENAI]: "gpt-5.4-nano",
    },
  },
  {
    id: TEXT_GENERATION_MODEL_IDS.GPT_5_4_MINI,
    name: "GPT-5.4 Mini",
    description: "Low-cost model with stronger output quality.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.OPENAI]: "gpt-5.4-mini",
    },
  },
  {
    id: TEXT_GENERATION_MODEL_IDS.GPT_5_4,
    name: "GPT-5.4",
    description: "More capable, still cheaper than GPT-5.5.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.OPENAI]: "gpt-5.4",
    },
  },
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
    id: TEXT_GENERATION_MODEL_IDS.GEMMA_4_31B,
    name: "Gemma 4 31B",
    description:
      "Largest open-weight Gemma model available via the Gemini API.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.GOOGLE_AI_STUDIO]: "gemma-4-31b-it",
    },
  },
  {
    id: TEXT_GENERATION_MODEL_IDS.GEMMA_4_26B_A4B,
    name: "Gemma 4 26B (A4B)",
    description: "Lighter, faster open-weight Gemma model.",
    providerModels: {
      [TEXT_GENERATION_PROVIDER_IDS.GOOGLE_AI_STUDIO]: "gemma-4-26b-a4b-it",
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
