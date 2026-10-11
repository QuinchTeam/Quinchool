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
