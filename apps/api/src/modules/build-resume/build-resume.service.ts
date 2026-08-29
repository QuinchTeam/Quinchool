/** Reads resume source data and delegates the stateless tailoring workflow. */

import { BadRequestException, Injectable, Logger } from "@nestjs/common";

import { callAiService } from "../../shared/clients/ai/ai-client";
import type { BuildResumeValues } from "./build-resume.contract";
import { BuildResumeRepository } from "./build-resume.repository";

export interface TailoredResume {
  experiences: { companyName: string; jobTitle: string; bullets: string[] }[];
  skillGroups: { label: string; skills: string[] }[];
}

@Injectable()
export class BuildResumeService {
  private readonly logger = new Logger(BuildResumeService.name);

  constructor(private readonly repository: BuildResumeRepository) {}

  async tailor(
    userId: string,
    values: BuildResumeValues,
  ): Promise<TailoredResume> {
    // Keep the same ordering as GET /career-profile and the resume preview.
    const careerProfile = await this.repository.findCareerProfile(userId);
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

    const result = await callAiService<TailoredResume>(
      "/resume/tailor",
      {
        ...values,
        experiences: experiences.map((experience) => ({
          ...experience,
          bullets: experience.bullets.map((bullet) => bullet.text),
        })),
        skillGroups,
      },
      "Failed to build resume",
    );

    this.logger.log("tailor.completed");
    return result;
  }
}
