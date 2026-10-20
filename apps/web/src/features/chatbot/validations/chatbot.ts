import { z } from "zod";

import { TEXT_GENERATION_MODEL_IDS } from "../../../lib/ai/text-generation/types.ts";

export const chatMessageSchema = z.object({
  content: z.string().trim().min(1).max(8_000),
  role: z.enum(["user", "assistant"]),
});

export const chatbotRequestSchema = z.object({
  // Omitting chatId starts a new conversation.
  chatId: z.string().trim().min(1).optional(),
  content: z.string().trim().min(1).max(8_000),
  modelId: z.enum(TEXT_GENERATION_MODEL_IDS),
});

export const chatTitleSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatbotRequest = z.infer<typeof chatbotRequestSchema>;
export type ChatTitle = z.infer<typeof chatTitleSchema>;
