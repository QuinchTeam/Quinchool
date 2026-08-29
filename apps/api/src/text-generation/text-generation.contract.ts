import { z } from "zod";

export const textGenerationSchema = z.object({
  modelId: z.string().trim().min(1),
  prompt: z.string().min(1, "Enter a prompt"),
});

export type TextGenerationValues = z.infer<typeof textGenerationSchema>;
