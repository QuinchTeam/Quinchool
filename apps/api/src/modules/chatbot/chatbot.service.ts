import { Injectable } from "@nestjs/common";

import { callAiService } from "../../shared/clients/ai/ai-client";
import type {
  GenerateTextResult,
  TextGenerationModelId,
} from "../text-generation/text-generation.types";
import type { ChatMessage } from "./chatbot.contract";
import { ChatbotRepository } from "./chatbot.repository";

export interface ChatbotResult extends GenerateTextResult {
  toolUsed: boolean;
}

interface AIChatbotResult extends GenerateTextResult {
  requiresCareerProfile: boolean;
}

@Injectable()
export class ChatbotService {
  constructor(private readonly repository: ChatbotRepository) {}

  /**
   * Answers in one pass unless the AI service requests the career profile, in
   * which case Nest reads it and makes the second stateless call.
   */
  async respond({
    messages,
    modelId,
    userId,
  }: {
    messages: ChatMessage[];
    modelId: TextGenerationModelId;
    userId: string;
  }): Promise<ChatbotResult> {
    const firstResponse = await callAiService<AIChatbotResult>(
      "/chatbot/respond",
      { messages, modelId },
      "The assistant could not respond. Try again.",
    );
    const { requiresCareerProfile, ...firstResult } = firstResponse;

    if (!requiresCareerProfile) {
      return { ...firstResult, toolUsed: false };
    }

    const careerProfile = await this.repository.findCareerProfile(userId);
    const finalResponse = await callAiService<AIChatbotResult>(
      "/chatbot/respond-with-profile",
      { careerProfile, messages, modelId },
      "The assistant could not respond. Try again.",
    );
    const { requiresCareerProfile: _, ...finalResult } = finalResponse;

    return { ...finalResult, toolUsed: true };
  }
}
