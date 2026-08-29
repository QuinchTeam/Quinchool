export type TextGenerationModelId = string;
export type TextGenerationProviderId = string;

export interface GenerateTextParams {
  modelId?: TextGenerationModelId;
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

export interface EnhancePromptResult {
  enhancedPrompt: string;
}
