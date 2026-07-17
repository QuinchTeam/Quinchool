export const TEXT_GENERATION_MODEL_IDS = {
  GEMINI_3_5_FLASH: "gemini-3.5-flash",
  GEMINI_3_1_FLASH_LITE: "gemini-3.1-flash-lite",
  GEMMA_4_26B_A4B: "gemma-4-26b-a4b",
  GLM_5_2: "glm-5.2",
  KIMI_K2_7_CODE: "kimi-k2.7-code",
  KIMI_K2_6: "kimi-k2.6",
  GPT_OSS_20B: "gpt-oss-20b",
} as const;

export const TEXT_GENERATION_PROVIDER_IDS = {
  GOOGLE_AI_STUDIO: "google-ai-studio",
  CLOUDFLARE_WORKERS_AI: "cloudflare-workers-ai",
  OPENROUTER: "openrouter",
  GROQ: "groq",
} as const;

export type TextGenerationModelId =
  (typeof TEXT_GENERATION_MODEL_IDS)[keyof typeof TEXT_GENERATION_MODEL_IDS];

export type TextGenerationProviderId =
  (typeof TEXT_GENERATION_PROVIDER_IDS)[keyof typeof TEXT_GENERATION_PROVIDER_IDS];

export interface GenerateTextParams {
  modelId?: TextGenerationModelId;
  prompt: string;
}

export interface ProviderGenerateTextParams {
  modelId: TextGenerationModelId;
  prompt: string;
}

export interface GenerateTextResult {
  modelId: TextGenerationModelId;
  providerId: TextGenerationProviderId;
  providerModelId: string;
  text: string;
}

export interface TextGenerationProviderAdapter {
  generateText(params: ProviderGenerateTextParams): Promise<GenerateTextResult>;
  providerId: TextGenerationProviderId;
}
