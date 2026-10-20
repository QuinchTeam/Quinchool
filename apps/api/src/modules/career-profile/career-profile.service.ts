import { Injectable, NotFoundException } from "@nestjs/common";

import {
  type CareerProfileValues,
  type ResumeLayout,
  resumeLayoutSchema,
} from "./career-profile.contract";
import { CareerProfileRepository } from "./career-profile.repository";

@Injectable()
export class CareerProfileService {
  constructor(private readonly repository: CareerProfileRepository) {}

  async get(userId: string): Promise<CareerProfileValues | null> {
    const profile = await this.repository.findByUserId(userId);

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

  async getResumeLayout(userId: string): Promise<ResumeLayout> {
    const stored = await this.repository.findResumeLayout(userId);
    const parsed = resumeLayoutSchema.safeParse(stored?.resumeLayout);
    return parsed.success ? parsed.data : { excluded: [], order: {} };
  }

  async saveResumeLayout(
    userId: string,
    layout: ResumeLayout,
  ): Promise<ResumeLayout> {
    const { count } = await this.repository.saveResumeLayout(userId, layout);
    if (count === 0) {
      throw new NotFoundException({
        code: "CAREER_PROFILE_NOT_FOUND",
        message: "Create a career profile before customizing the resume.",
      });
    }
    return layout;
  }

  async save(
    userId: string,
    values: CareerProfileValues,
  ): Promise<CareerProfileValues> {
    await this.repository.save(userId, values);
    return values;
  }
}

// Forms store YYYY-MM; the database stores full dates.
function toMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}
