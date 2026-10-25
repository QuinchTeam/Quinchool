export const TEXT_GENERATION_MODEL_IDS = {
  GEMINI_3_6_FLASH: "gemini-3.6-flash",
  GEMINI_3_5_FLASH_LITE: "gemini-3.5-flash-lite",
  GEMMA_4_26B_A4B: "gemma-4-26b-a4b",
  QWEN_3_8_27B: "qwen-3.8-27b",
  NORTH_MINI_CODE: "north-mini-code",
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

export interface TextGenerationUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface GenerateTextResult {
  modelId: TextGenerationModelId;
  providerId: TextGenerationProviderId;
  providerModelId: string;
  text: string;
  usage?: TextGenerationUsage;
}

export interface TextGenerationProviderAdapter {
  generateText(params: ProviderGenerateTextParams): Promise<GenerateTextResult>;
  providerId: TextGenerationProviderId;
}
