import { Injectable } from "@nestjs/common";

import { callAIService } from "../common/ai-service";
import { PrismaService } from "../prisma/prisma.service";
import type {
  GenerateTextResult,
  TextGenerationModelId,
} from "../text-generation/types";
import type { ChatMessage } from "./chatbot.contract";

export interface ChatbotResult extends GenerateTextResult {
  toolUsed: boolean;
}

interface AIChatbotResult extends GenerateTextResult {
  requiresCareerProfile: boolean;
}

@Injectable()
export class ChatbotService {
  constructor(private readonly prisma: PrismaService) {}

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
    const firstResponse = await callAIService<AIChatbotResult>(
      "/chatbot/respond",
      { messages, modelId },
      "The assistant could not respond. Try again.",
    );
    const { requiresCareerProfile, ...firstResult } = firstResponse;

    if (!requiresCareerProfile) {
      return { ...firstResult, toolUsed: false };
    }

    const careerProfile = await getCareerProfile(this.prisma, userId);
    const finalResponse = await callAIService<AIChatbotResult>(
      "/chatbot/respond-with-profile",
      { careerProfile, messages, modelId },
      "The assistant could not respond. Try again.",
    );
    const { requiresCareerProfile: _, ...finalResult } = finalResponse;

    return { ...finalResult, toolUsed: true };
  }
}

/** Only the fields the assistant is allowed to talk about. */
function getCareerProfile(prisma: PrismaService, userId: string) {
  return prisma.careerProfile.findUnique({
    where: { userId },
    select: {
      name: true,
      github: true,
      linkedin: true,
      personalWebsite: true,
      educations: {
        orderBy: { sortOrder: "asc" },
        select: {
          degree: true,
          endDate: true,
          fieldOfStudy: true,
          institutionName: true,
          location: true,
          specialization: true,
          startDate: true,
        },
      },
      skillGroups: {
        orderBy: { sortOrder: "asc" },
        select: {
          label: true,
          skills: {
            orderBy: { sortOrder: "asc" },
            select: { name: true },
          },
        },
      },
      experiences: {
        orderBy: { sortOrder: "asc" },
        select: {
          companyName: true,
          employmentType: true,
          endDate: true,
          isCurrent: true,
          jobTitle: true,
          location: true,
          startDate: true,
          bullets: {
            orderBy: { sortOrder: "asc" },
            select: { text: true },
          },
          skills: {
            orderBy: { sortOrder: "asc" },
            select: { name: true },
          },
        },
      },
      projects: {
        orderBy: { sortOrder: "asc" },
        select: {
          endDate: true,
          isCurrent: true,
          projectName: true,
          startDate: true,
          bullets: {
            orderBy: { sortOrder: "asc" },
            select: { text: true },
          },
          skills: {
            orderBy: { sortOrder: "asc" },
            select: { name: true },
          },
        },
      },
    },
  });
}
