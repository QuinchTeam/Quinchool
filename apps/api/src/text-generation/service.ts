import { callAIService } from "../common/ai-service";
import type {
  EnhancePromptResult,
  GenerateTextParams,
  GenerateTextResult,
} from "./types";

export function generateText(
  params: GenerateTextParams,
): Promise<GenerateTextResult> {
  return callAIService("/text-generation", params, "Failed to generate text");
}

export function enhancePrompt(
  params: GenerateTextParams,
): Promise<EnhancePromptResult> {
  return callAIService("/prompt-enhancer", params, "Failed to enhance prompt");
}
