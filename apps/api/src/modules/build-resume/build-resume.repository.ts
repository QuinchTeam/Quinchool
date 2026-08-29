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
          include: { bullets: { orderBy: { sortOrder: "asc" } } },
        },
        skillGroups: {
          orderBy: { sortOrder: "asc" },
          include: { skills: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });
  }
}
