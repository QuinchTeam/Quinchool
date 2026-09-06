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

/**
 * What the browser sends back once the user has filled in and confirmed the
 * form a write tool asked for. `arguments` is echoed from the pending action so
 * the server knows which entry is being changed without holding chat state.
 */
export const toolActionSchema = z.object({
  tool: z.string().trim().min(1),
  arguments: z.record(z.string(), z.unknown()).default({}),
  values: z.record(z.string(), z.unknown()).default({}),
  /**
   * The conversation so far. Confirming a write resumes the chain rather than
   * ending it, so the model can follow up — read back what it just changed, or
   * ask for the next step the user requested in the same breath.
   */
  messages: z.array(chatMessageSchema).min(1).max(24),
  modelId: z.string().trim().min(1),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatbotRequest = z.infer<typeof chatbotRequestSchema>;
export type ToolAction = z.infer<typeof toolActionSchema>;
