/**
 * Tailors the stored career profile to one job requirement. Ported from
 * apps/web/src/app/api/build-resume/route.ts.
 */

import { BadRequestException, Injectable, Logger } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { generateText } from "../text-generation/service";
import {
  type BuildResumeValues,
  tailorSelectionSchema,
} from "./build-resume.contract";
import { buildTailorResumePrompt } from "./prompts";
import {
  parseJsonObject,
  reconcileTailoredResume,
  type TailoredResume,
} from "./tailoring";

/** Raised when the model's reply is not the JSON selection that was asked for. */
export class UnreadableTailorReplyError extends Error {
  constructor() {
    super("The model returned an unreadable result. Try again.");
    this.name = "UnreadableTailorReplyError";
  }
}

@Injectable()
export class BuildResumeService {
  private readonly logger = new Logger(BuildResumeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async tailor(
    userId: string,
    values: BuildResumeValues,
  ): Promise<TailoredResume> {
    // Same ordering as GET /career-profile, so the ids in the prompt line up
    // with the profile the preview already rendered.
    const careerProfile = await this.prisma.careerProfile.findUnique({
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
    const experiences =
      careerProfile?.experiences.map((experience) => ({
        companyName: experience.companyName,
        jobTitle: experience.jobTitle,
        bullets: experience.bullets.map((bullet) => ({ text: bullet.text })),
      })) ?? [];
    const skillGroups =
      careerProfile?.skillGroups.map((group) => ({
        label: group.label,
        skills: group.skills.map((skill) => skill.name),
      })) ?? [];

    if (!experiences.some((experience) => experience.bullets.length)) {
      throw new BadRequestException({
        error: "Add at least one experience before building a resume",
      });
    }

    const result = await generateText({
      modelId: values.modelId,
      prompt: buildTailorResumePrompt({
        experiences: experiences.map((experience) => ({
          ...experience,
          bullets: experience.bullets.map((bullet) => bullet.text),
        })),
        jobRequirement: values.jobRequirement,
        skillGroups,
      }),
    });

    this.logger.log(`tailor.generated ${JSON.stringify({
      providerId: result.providerId,
    })}`);

    const selection = tailorSelectionSchema.safeParse(
      parseJsonObject(result.text),
    );

    if (!selection.success) {
      throw new UnreadableTailorReplyError();
    }

    return reconcileTailoredResume({ experiences, skillGroups }, selection.data);
  }
}
