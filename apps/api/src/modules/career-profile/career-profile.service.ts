import { Injectable } from "@nestjs/common";

import type { CareerProfileValues } from "./career-profile.contract";
import { CareerProfileRepository } from "./career-profile.repository";

@Injectable()
export class CareerProfileService {
  constructor(private readonly repository: CareerProfileRepository) {}

  /** Null when the user has not built a profile yet. */
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

  async save(
    userId: string,
    values: CareerProfileValues,
  ): Promise<CareerProfileValues> {
    await this.repository.save(userId, values);
    return values;
  }
}

/** The form works in months, the database in dates. */
function toMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}
