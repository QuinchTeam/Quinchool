import { z } from "zod";

export const createResumeBulletSchema = z.object({
  companyName: z.string().min(1, "Enter a company name"),
  experience: z.string().min(1, "Enter an experience"),
});

export const updateResumeBulletSchema = createResumeBulletSchema.partial();

export type CreateResumeBulletValues = z.infer<typeof createResumeBulletSchema>;
export type UpdateResumeBulletValues = z.infer<typeof updateResumeBulletSchema>;
