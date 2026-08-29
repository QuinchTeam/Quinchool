import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../core/database/prisma/prisma.service";

@Injectable()
export class ChatbotRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Only the fields the assistant is allowed to talk about. */
  findCareerProfile(userId: string) {
    return this.prisma.careerProfile.findUnique({
      where: { userId },
      select: {
        name: true,
        github: true,
        linkedin: true,
        personalWebsite: true,
        educations: {
          orderBy: { sortOrder: "asc" },
          select: {
            degree: true,
            endDate: true,
            fieldOfStudy: true,
            institutionName: true,
            location: true,
            specialization: true,
            startDate: true,
          },
        },
        skillGroups: {
          orderBy: { sortOrder: "asc" },
          select: {
            label: true,
            skills: {
              orderBy: { sortOrder: "asc" },
              select: { name: true },
            },
          },
        },
        experiences: {
          orderBy: { sortOrder: "asc" },
          select: {
            companyName: true,
            employmentType: true,
            endDate: true,
            isCurrent: true,
            jobTitle: true,
            location: true,
            startDate: true,
            bullets: {
              orderBy: { sortOrder: "asc" },
              select: { text: true },
            },
            skills: {
              orderBy: { sortOrder: "asc" },
              select: { name: true },
            },
          },
        },
        projects: {
          orderBy: { sortOrder: "asc" },
          select: {
            endDate: true,
            isCurrent: true,
            projectName: true,
            startDate: true,
            bullets: {
              orderBy: { sortOrder: "asc" },
              select: { text: true },
            },
            skills: {
              orderBy: { sortOrder: "asc" },
              select: { name: true },
            },
          },
        },
      },
    });
  }
}
