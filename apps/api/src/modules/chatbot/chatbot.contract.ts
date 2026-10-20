import { z } from "zod";

export const chatMessageSchema = z.object({
  content: z.string().trim().min(1).max(8_000),
  role: z.enum(["user", "assistant"]),
});

export const chatIdSchema = z.string().trim().min(1).max(64);

export const chatTitleSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export const chatbotRequestSchema = z.object({
  // Omitting chatId creates a new chat.
  chatId: chatIdSchema.optional(),
  content: z.string().trim().min(1).max(8_000),
  modelId: z.string().trim().min(1),
});

export const toolActionSchema = z.object({
  chatId: chatIdSchema,
  messageId: chatIdSchema,
  tool: z.string().trim().min(1),
  arguments: z.record(z.string(), z.unknown()).default({}),
  values: z.record(z.string(), z.unknown()).default({}),
  modelId: z.string().trim().min(1),
});

export const dismissActionSchema = z.object({
  chatId: chatIdSchema,
  messageId: chatIdSchema,
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatbotRequest = z.infer<typeof chatbotRequestSchema>;
export type ChatTitle = z.infer<typeof chatTitleSchema>;
export type ToolAction = z.infer<typeof toolActionSchema>;
export type DismissAction = z.infer<typeof dismissActionSchema>;
