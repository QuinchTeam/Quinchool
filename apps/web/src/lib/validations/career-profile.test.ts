import assert from "node:assert/strict";
import test from "node:test";

import { careerProfileSchema } from "@/lib/validations/career-profile";

const validProfile = {
  name: "Cyril James De Guzman",
  email: "cyril@example.com",
  contactNumber: "+63 900 000 0000",
  linkedin: "",
  github: "",
  personalWebsite: "",
  educations: [],
  skillGroups: [{ label: "Frontend", skills: ["Next.js"] }],
  experiences: [
    {
      jobTitle: "Full-Stack Engineer",
      companyName: "Example",
      location: "Remote",
      employmentType: "Full-time",
      skills: ["Next.js"],
      bullets: [{ text: "Built production applications." }],
      isCurrent: true,
      startDate: "2026-03",
      endDate: "",
    },
  ],
  projects: [],
};

test("validates career profile dates and skill references", () => {
  assert.equal(careerProfileSchema.safeParse(validProfile).success, true);
  assert.equal(
    careerProfileSchema.safeParse({
      ...validProfile,
      experiences: [
        {
          ...validProfile.experiences[0],
          skills: ["Unknown skill"],
          isCurrent: false,
        },
      ],
    }).success,
    false,
  );
});

test("normalizes website fields without a protocol", () => {
  const profile = careerProfileSchema.parse({
    ...validProfile,
    linkedin: "linkedin.com/in/quinchy",
    github: "github.com/quinchy",
    personalWebsite: "quinchy.dev",
  });

  assert.equal(profile.linkedin, "https://linkedin.com/in/quinchy");
  assert.equal(profile.github, "https://github.com/quinchy");
  assert.equal(profile.personalWebsite, "https://quinchy.dev");
});

test("allows the same skill in different groups", () => {
  assert.equal(
    careerProfileSchema.safeParse({
      ...validProfile,
      skillGroups: [
        { label: "Frontend", skills: ["Next.js"] },
        { label: "Backend", skills: ["Next.js"] },
      ],
    }).success,
    true,
  );
  assert.equal(
    careerProfileSchema.safeParse({
      ...validProfile,
      skillGroups: [{ label: "Frontend", skills: ["Next.js", "next.js"] }],
    }).success,
    false,
  );
});
