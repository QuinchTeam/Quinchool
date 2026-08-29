import { z } from "zod";
export const buildResumeSchema = z.object({
  jobRequirement: z.string().min(1, "Enter a job requirement"),
  modelId: z.string().trim().min(1),
});

export type BuildResumeValues = z.infer<typeof buildResumeSchema>;
