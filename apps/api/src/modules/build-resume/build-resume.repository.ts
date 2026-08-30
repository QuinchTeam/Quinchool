import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../core/database/prisma/prisma.service";

@Injectable()
export class BuildResumeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCareerProfile(userId: string) {
    return this.prisma.careerProfile.findUnique({
      where: { userId },
      include: {
        experiences: {
          orderBy: { sortOrder: "asc" },
          include: {
            bullets: { orderBy: { sortOrder: "asc" } },
            skills: { orderBy: { sortOrder: "asc" } },
          },
        },
        projects: {
          orderBy: { sortOrder: "asc" },
          include: {
            bullets: { orderBy: { sortOrder: "asc" } },
            skills: { orderBy: { sortOrder: "asc" } },
          },
        },
        educations: true,
        skillGroups: {
          orderBy: { sortOrder: "asc" },
          include: { skills: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });
  }

  findSavedJob(userId: string, jobId: string) {
    return this.prisma.scrapedJob.findFirst({
      where: { id: jobId, userId },
      select: {
        company: true,
        description: true,
        summary: true,
        title: true,
      },
    });
  }
}
