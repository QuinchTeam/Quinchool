import { z } from "zod";

export const chatMessageSchema = z.object({
  content: z.string().trim().min(1).max(8_000),
  role: z.enum(["user", "assistant"]),
});

export const chatbotRequestSchema = z
  .object({
    messages: z.array(chatMessageSchema).min(1).max(24),
    modelId: z.string().trim().min(1),
  })
  .refine((request) => request.messages.at(-1)?.role === "user", {
    message: "The last message must be from the user",
    path: ["messages"],
  });

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatbotRequest = z.infer<typeof chatbotRequestSchema>;
