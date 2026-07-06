export const TEXT_GENERATION_MODEL_IDS = {
  GPT_5_4_NANO: "gpt-5.4-nano",
  GPT_5_4_MINI: "gpt-5.4-mini",
  GPT_5_4: "gpt-5.4",
  GEMINI_3_5_FLASH: "gemini-3.5-flash",
  GEMINI_3_1_FLASH_LITE: "gemini-3.1-flash-lite",
  GEMMA_4_31B: "gemma-4-31b",
  GEMMA_4_26B_A4B: "gemma-4-26b-a4b",
} as const;

export const TEXT_GENERATION_PROVIDER_IDS = {
  OPENAI: "openai",
  GOOGLE_AI_STUDIO: "google-ai-studio",
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
}
