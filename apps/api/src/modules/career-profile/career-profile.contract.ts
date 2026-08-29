/**
 * The career profile as it travels over the wire, and every rule it has to
 * satisfy. Kept identical to apps/web/src/lib/validations/career-profile.ts:
 * the web app validates the same shape client-side so its form can report
 * errors per field before it ever sends them.
 */

import { z } from "zod";

const requiredText = (label: string, max = 500) =>
  z.string().trim().min(1, `${label} is required`).max(max);
const optionalText = (max = 500) => z.string().trim().max(max);
const month = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Select a valid month");
const optionalMonth = z.union([z.literal(""), month]);
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .transform((value) =>
    value && !URL.canParse(value) ? `https://${value}` : value,
  )
  .pipe(z.union([z.literal(""), z.url("Enter a valid URL")]));

const bulletSchema = z.object({
  text: requiredText("Bullet", 2_000),
});

const experienceSchema = z
  .object({
    jobTitle: requiredText("Job title"),
    companyName: requiredText("Company name"),
    location: requiredText("Location"),
    employmentType: optionalText(),
    skills: z.array(requiredText("Skill", 100)).max(500),
    bullets: z.array(bulletSchema).min(1).max(200),
    isCurrent: z.boolean(),
    startDate: month,
    endDate: optionalMonth,
  })
  .superRefine((experience, context) => {
    if (!experience.isCurrent && !experience.endDate) {
      context.addIssue({
        code: "custom",
        message: "End date is required",
        path: ["endDate"],
      });
    }

    if (experience.endDate && experience.startDate > experience.endDate) {
      context.addIssue({
        code: "custom",
        message: "End date must be after the start date",
        path: ["endDate"],
      });
    }
  });

const projectSchema = z
  .object({
    projectName: requiredText("Project name"),
    skills: z.array(requiredText("Skill", 100)).max(500),
    bullets: z.array(bulletSchema).min(1).max(200),
    isCurrent: z.boolean(),
    startDate: month,
    endDate: optionalMonth,
  })
  .superRefine((project, context) => {
    if (!project.isCurrent && !project.endDate) {
      context.addIssue({
        code: "custom",
        message: "End date is required",
        path: ["endDate"],
      });
    }

    if (project.endDate && project.startDate > project.endDate) {
      context.addIssue({
        code: "custom",
        message: "End date must be after the start date",
        path: ["endDate"],
      });
    }
  });

export const careerProfileSchema = z
  .object({
    name: requiredText("Name"),
    email: z.email("Enter a valid email address"),
    contactNumber: requiredText("Contact number", 100),
    linkedin: optionalUrl,
    github: optionalUrl,
    personalWebsite: optionalUrl,
    educations: z
      .array(
        z
          .object({
            institutionName: requiredText("Institution name"),
            location: requiredText("Location"),
            degree: requiredText("Degree"),
            fieldOfStudy: requiredText("Field of study"),
            specialization: optionalText(),
            startDate: month,
            endDate: month,
          })
          .refine((education) => education.startDate <= education.endDate, {
            message: "End date must be after the start date",
            path: ["endDate"],
          }),
      )
      .max(20),
    skillGroups: z
      .array(
        z.object({
          label: requiredText("Skill group"),
          skills: z.array(requiredText("Skill", 100)).min(1).max(500),
        }),
      )
      .max(50),
    experiences: z.array(experienceSchema).max(50),
    projects: z.array(projectSchema).max(100),
  })
  .superRefine((profile, context) => {
    const knownSkills = new Set<string>();

    profile.skillGroups.forEach((group, groupIndex) => {
      const groupSkills = new Set<string>();

      group.skills.forEach((skill, skillIndex) => {
        const key = skill.toLocaleLowerCase();

        if (groupSkills.has(key)) {
          context.addIssue({
            code: "custom",
            message: "Skill names must be unique within a group",
            path: ["skillGroups", groupIndex, "skills", skillIndex],
          });
        }

        groupSkills.add(key);
        knownSkills.add(key);
      });
    });

    for (const [collectionName, entries] of [
      ["experiences", profile.experiences],
      ["projects", profile.projects],
    ] as const) {
      entries.forEach((entry, entryIndex) => {
        entry.skills.forEach((skill, skillIndex) => {
          if (!knownSkills.has(skill.toLocaleLowerCase())) {
            context.addIssue({
              code: "custom",
              message: "Add this skill to a skill group first",
              path: [collectionName, entryIndex, "skills", skillIndex],
            });
          }
        });
      });
    }
  });

export type CareerProfileValues = z.infer<typeof careerProfileSchema>;
