import { z } from "zod";
import { TEXT_GENERATION_MODEL_IDS } from "@/lib/ai/text-generation/types";

export const buildResumeSchema = z.object({
  jobRequirement: z.string().min(1, "Enter a job requirement"),
  modelId: z.enum(TEXT_GENERATION_MODEL_IDS),
});

export type BuildResumeValues = z.infer<typeof buildResumeSchema>;

// Model IDs reference source positions; recheck selected text against the stored profile.
export const tailorSelectionSchema = z.object({
  experiences: z
    .array(
      z.object({
        id: z.string(),
        bullets: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  skillGroups: z
    .array(
      z.object({
        id: z.string(),
        skills: z.array(z.string()).optional(),
      }),
    )
    .optional(),
});

export type TailorSelection = z.infer<typeof tailorSelectionSchema>;
