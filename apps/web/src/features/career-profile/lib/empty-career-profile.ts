import type { CareerProfileValues } from "../validations/career-profile";

export const emptyCareerProfile = (): CareerProfileValues => ({
  name: "",
  email: "",
  contactNumber: "",
  linkedin: "",
  github: "",
  personalWebsite: "",
  educations: [],
  skillGroups: [],
  experiences: [],
  projects: [],
});

export const emptyEducation =
  (): CareerProfileValues["educations"][number] => ({
    institutionName: "",
    location: "",
    degree: "",
    fieldOfStudy: "",
    specialization: "",
    startDate: "",
    endDate: "",
  });

export const emptySkillGroup =
  (): CareerProfileValues["skillGroups"][number] => ({
    label: "",
    skills: [],
  });

export const emptyExperience =
  (): CareerProfileValues["experiences"][number] => ({
    jobTitle: "",
    companyName: "",
    location: "",
    employmentType: "",
    skills: [],
    bullets: [{ text: "" }],
    isCurrent: false,
    startDate: "",
    endDate: "",
  });

export const emptyProject = (): CareerProfileValues["projects"][number] => ({
  projectName: "",
  skills: [],
  bullets: [{ text: "" }],
  isCurrent: false,
  startDate: "",
  endDate: "",
});
