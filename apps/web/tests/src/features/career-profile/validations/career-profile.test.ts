import assert from "node:assert/strict";
import { test } from "vite-plus/test";

import { careerProfileSchema } from "@/features/career-profile/validations/career-profile";

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

test("empty lists report readable messages, not Zod defaults", () => {
  const result = careerProfileSchema.safeParse({
    ...validProfile,
    skillGroups: [{ label: "Frontend", skills: [] }],
    experiences: [{ ...validProfile.experiences[0], skills: [], bullets: [] }],
  });
  assert.equal(result.success, false);
  const messages = result.error?.issues.map((issue) => issue.message) ?? [];
  assert.ok(messages.includes("Add at least one skill to this group"));
  assert.ok(messages.includes("Add at least one bullet"));
  assert.ok(messages.every((message) => !message.startsWith("Too small")));
});
