import { z } from "zod";
import { TEXT_GENERATION_MODEL_IDS } from "@/lib/ai/text-generation/types";

export const buildResumeSchema = z.object({
  jobRequirement: z.string().min(1, "Enter a job requirement"),
  modelId: z.enum(TEXT_GENERATION_MODEL_IDS),
});

export type BuildResumeValues = z.infer<typeof buildResumeSchema>;
