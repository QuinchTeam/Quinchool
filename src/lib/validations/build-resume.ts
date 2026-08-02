import { z } from "zod";
import { TEXT_GENERATION_MODEL_IDS } from "@/lib/ai/text-generation/types";

export const buildResumeSchema = z.object({
  jobRequirement: z.string().min(1, "Enter a job requirement"),
  modelId: z.enum(TEXT_GENERATION_MODEL_IDS),
});

export type BuildResumeValues = z.infer<typeof buildResumeSchema>;

// What the model is asked to reply with. Ids reference the experience /
// skill-group order sent in the prompt; the texts are re-checked against the
// career profile afterwards, so an invented bullet never reaches the resume.
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
