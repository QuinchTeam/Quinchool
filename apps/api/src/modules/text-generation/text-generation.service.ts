import { callAiService } from "../../shared/clients/ai/ai-client";
import type {
  EnhancePromptResult,
  GenerateTextParams,
  GenerateTextResult,
} from "./text-generation.types";

export function generateText(
  params: GenerateTextParams,
): Promise<GenerateTextResult> {
  return callAiService("/text-generation", params, "Failed to generate text");
}

export function enhancePrompt(
  params: GenerateTextParams,
): Promise<EnhancePromptResult> {
  return callAiService("/prompt-enhancer", params, "Failed to enhance prompt");
}
