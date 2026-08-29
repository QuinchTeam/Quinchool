import { z } from "zod";

import { TEXT_GENERATION_MODEL_IDS } from "./types";

export const textGenerationSchema = z.object({
  modelId: z.enum(TEXT_GENERATION_MODEL_IDS),
  prompt: z.string().min(1, "Enter a prompt"),
});

export type TextGenerationValues = z.infer<typeof textGenerationSchema>;
