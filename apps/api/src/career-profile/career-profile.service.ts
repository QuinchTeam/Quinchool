/**
 * Reads and writes the one career profile a user owns. Ported from
 * apps/web/src/app/api/career-profile/route.ts when the API took the feature
 * over.
 */

import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import type { CareerProfileValues } from "./career-profile.contract";

// Every list the profile owns is user-ordered, so each one is read back in the
// order it was saved rather than whatever the database returns.
const orderedCareerProfile = {
  educations: { orderBy: { sortOrder: "asc" as const } },
  skillGroups: {
    orderBy: { sortOrder: "asc" as const },
    include: { skills: { orderBy: { sortOrder: "asc" as const } } },
  },
  experiences: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      bullets: { orderBy: { sortOrder: "asc" as const } },
      skills: { orderBy: { sortOrder: "asc" as const } },
    },
  },
  projects: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      bullets: { orderBy: { sortOrder: "asc" as const } },
      skills: { orderBy: { sortOrder: "asc" as const } },
    },
  },
} as const;

@Injectable()
export class CareerProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /** Null when the user has not built a profile yet. */
  async get(userId: string): Promise<CareerProfileValues | null> {
    const profile = await this.prisma.careerProfile.findUnique({
      where: { userId },
      include: orderedCareerProfile,
    });

    if (!profile) {
      return null;
    }

    return {
      name: profile.name,
      email: profile.email,
      contactNumber: profile.contactNumber,
      linkedin: profile.linkedin ?? "",
      github: profile.github ?? "",
      personalWebsite: profile.personalWebsite ?? "",
      educations: profile.educations.map((education) => ({
        institutionName: education.institutionName,
        location: education.location,
        degree: education.degree,
        fieldOfStudy: education.fieldOfStudy,
        specialization: education.specialization ?? "",
        startDate: toMonth(education.startDate),
        endDate: toMonth(education.endDate),
      })),
      skillGroups: profile.skillGroups.map((group) => ({
        label: group.label,
        skills: group.skills.map((skill) => skill.name),
      })),
      experiences: profile.experiences.map((experience) => ({
        jobTitle: experience.jobTitle,
        companyName: experience.companyName,
        location: experience.location,
        employmentType: experience.employmentType ?? "",
        skills: experience.skills.map((skill) => skill.name),
        bullets: experience.bullets.map((bullet) => ({ text: bullet.text })),
        isCurrent: experience.isCurrent,
        startDate: toMonth(experience.startDate),
        endDate: experience.endDate ? toMonth(experience.endDate) : "",
      })),
      projects: profile.projects.map((project) => ({
        projectName: project.projectName,
        skills: project.skills.map((skill) => skill.name),
        bullets: project.bullets.map((bullet) => ({ text: bullet.text })),
        isCurrent: project.isCurrent,
        startDate: toMonth(project.startDate),
        endDate: project.endDate ? toMonth(project.endDate) : "",
      })),
    };
  }

  async save(
    userId: string,
    values: CareerProfileValues,
  ): Promise<CareerProfileValues> {
    await this.prisma.$transaction(async (transaction) => {
      const contact = {
        name: values.name,
        email: values.email,
        contactNumber: values.contactNumber,
        linkedin: values.linkedin || null,
        github: values.github || null,
        personalWebsite: values.personalWebsite || null,
      };
      const profile = await transaction.careerProfile.upsert({
        where: { userId },
        create: { userId, ...contact },
        update: contact,
      });

      // ponytail: whole-profile replacement is atomic and simple; preserve
      // child IDs when embeddings or concurrent editing make stable identity
      // necessary.
      await transaction.experience.deleteMany({
        where: { careerProfileId: profile.id },
      });
      await transaction.project.deleteMany({
        where: { careerProfileId: profile.id },
      });
      await transaction.education.deleteMany({
        where: { careerProfileId: profile.id },
      });
      await transaction.skillGroup.deleteMany({
        where: { careerProfileId: profile.id },
      });

      // Experiences and projects name their skills as plain strings; the rows
      // they connect to are the ones the skill groups just created.
      const skillIds = new Map<string, string>();

      for (const [sortOrder, group] of values.skillGroups.entries()) {
        const createdGroup = await transaction.skillGroup.create({
          data: {
            careerProfileId: profile.id,
            label: group.label,
            sortOrder,
            skills: {
              create: group.skills.map((name, skillSortOrder) => ({
                name,
                sortOrder: skillSortOrder,
              })),
            },
          },
          include: { skills: true },
        });

        for (const skill of createdGroup.skills) {
          const key = skill.name.toLocaleLowerCase();
          if (!skillIds.has(key)) skillIds.set(key, skill.id);
        }
      }

      for (const [sortOrder, education] of values.educations.entries()) {
        await transaction.education.create({
          data: {
            careerProfileId: profile.id,
            institutionName: education.institutionName,
            location: education.location,
            degree: education.degree,
            fieldOfStudy: education.fieldOfStudy,
            specialization: education.specialization || null,
            startDate: fromMonth(education.startDate),
            endDate: fromMonth(education.endDate),
            sortOrder,
          },
        });
      }

      for (const [sortOrder, experience] of values.experiences.entries()) {
        await transaction.experience.create({
          data: {
            careerProfileId: profile.id,
            jobTitle: experience.jobTitle,
            companyName: experience.companyName,
            location: experience.location,
            employmentType: experience.employmentType || null,
            isCurrent: experience.isCurrent,
            startDate: fromMonth(experience.startDate),
            endDate: experience.isCurrent
              ? null
              : fromMonth(experience.endDate),
            sortOrder,
            bullets: {
              create: experience.bullets.map((bullet, bulletSortOrder) => ({
                text: bullet.text,
                sortOrder: bulletSortOrder,
              })),
            },
            skills: {
              connect: experience.skills.map((skill) => ({
                id: skillIds.get(skill.toLocaleLowerCase()),
              })),
            },
          },
        });
      }

      for (const [sortOrder, project] of values.projects.entries()) {
        await transaction.project.create({
          data: {
            careerProfileId: profile.id,
            projectName: project.projectName,
            isCurrent: project.isCurrent,
            startDate: fromMonth(project.startDate),
            endDate: project.isCurrent ? null : fromMonth(project.endDate),
            sortOrder,
            bullets: {
              create: project.bullets.map((bullet, bulletSortOrder) => ({
                text: bullet.text,
                sortOrder: bulletSortOrder,
              })),
            },
            skills: {
              connect: project.skills.map((skill) => ({
                id: skillIds.get(skill.toLocaleLowerCase()),
              })),
            },
          },
        });
      }
    });

    return values;
  }
}

/** The form works in months, the database in dates. */
function toMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function fromMonth(month: string): Date {
  return new Date(`${month}-01T00:00:00.000Z`);
}
