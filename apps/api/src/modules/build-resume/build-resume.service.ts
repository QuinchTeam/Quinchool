/** Reads resume source data and delegates the stateless tailoring workflow. */

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";

import { callAiService } from "../../shared/clients/ai/ai-client";
import type { BuildResumeValues } from "./build-resume.contract";
import { BuildResumeRepository } from "./build-resume.repository";

export interface TailoredResume {
  experiences: { companyName: string; jobTitle: string; bullets: string[] }[];
  projects: { projectName: string; bullets: string[] }[];
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
    const [careerProfile, savedJob] = await Promise.all([
      this.repository.findCareerProfile(userId),
      values.jobId
        ? this.repository.findSavedJob(userId, values.jobId)
        : Promise.resolve(null),
    ]);

    if (values.jobId && !savedJob) {
      throw new NotFoundException({ error: "Saved job not found" });
    }

    const experiences =
      careerProfile?.experiences.map((experience) => ({
        companyName: experience.companyName,
        jobTitle: experience.jobTitle,
        skills: experience.skills.map((skill) => skill.name),
        bullets: experience.bullets.map((bullet) => ({ text: bullet.text })),
      })) ?? [];
    const projects =
      careerProfile?.projects.map((project) => ({
        projectName: project.projectName,
        skills: project.skills.map((skill) => skill.name),
        bullets: project.bullets.map((bullet) => bullet.text),
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
        modelId: values.modelId,
        jobRequirement: savedJob
          ? `${savedJob.title} at ${savedJob.company}\n\n${savedJob.description || savedJob.summary}`
          : values.jobRequirement,
        fit: values.fit,
        renderedPageCount: values.renderedPageCount,
        renderedFillRatio: values.renderedFillRatio,
        previousResume: values.previousResume,
        experiences: experiences.map((experience) => ({
          ...experience,
          bullets: experience.bullets.map((bullet) => bullet.text),
        })),
        projects,
        skillGroups,
        educationCount: careerProfile?.educations.length ?? 0,
      },
      "Failed to build resume",
    );

    this.logger.log("tailor.completed");
    return result;
  }
}
