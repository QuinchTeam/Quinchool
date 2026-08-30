import { z } from "zod";

const tailoredResumeSchema = z.object({
  experiences: z
    .array(
      z.object({
        companyName: z.string().max(500),
        jobTitle: z.string().max(500),
        bullets: z.array(z.string().max(2_000)).max(200),
      }),
    )
    .max(50),
  projects: z
    .array(
      z.object({
        projectName: z.string().max(500),
        bullets: z.array(z.string().max(2_000)).max(200),
      }),
    )
    .max(100),
  skillGroups: z
    .array(
      z.object({
        label: z.string().max(500),
        skills: z.array(z.string().max(100)).max(500),
      }),
    )
    .max(50),
});

export const buildResumeSchema = z
  .object({
    jobRequirement: z.string().trim().min(1).max(100_000).optional(),
    jobId: z.string().trim().min(1).max(100).optional(),
    modelId: z.string().trim().min(1).max(100),
    fit: z.enum(["expand", "reduce"]).optional(),
    renderedPageCount: z.number().int().positive().optional(),
    renderedFillRatio: z.number().min(0).max(2).optional(),
    previousResume: tailoredResumeSchema.optional(),
  })
  .refine((value) => Boolean(value.jobRequirement) !== Boolean(value.jobId), {
    message: "Provide either a job requirement or saved job",
    path: ["jobRequirement"],
  });

export type BuildResumeValues = z.infer<typeof buildResumeSchema>;
