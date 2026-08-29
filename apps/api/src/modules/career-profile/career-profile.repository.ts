import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../core/database/prisma/prisma.service";
import type { CareerProfileValues } from "./career-profile.contract";

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
export class CareerProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.careerProfile.findUnique({
      where: { userId },
      include: orderedCareerProfile,
    });
  }

  async save(userId: string, values: CareerProfileValues): Promise<void> {
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
  }
}

function fromMonth(month: string): Date {
  return new Date(`${month}-01T00:00:00.000Z`);
}
