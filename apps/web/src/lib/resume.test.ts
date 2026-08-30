import assert from "node:assert/strict";
import test from "node:test";

import {
  applyTailoredResume,
  displayUrl,
  filterResumeContent,
  formatDateRange,
  parseJsonObject,
  reconcileTailoredResume,
  resumeFileName,
} from "@/lib/resume";

test("formats profile fields for display and download", () => {
  assert.equal(formatDateRange("2026-03", "", true), "March 2026 - Present");
  assert.equal(
    displayUrl("https://www.example.com/profile/"),
    "example.com/profile",
  );
  assert.equal(
    resumeFileName("Cyril James De Guzman"),
    "cyril-james-de-guzman-resume.pdf",
  );
});

test("filters and orders session-only resume bullets and skills", () => {
  const profile = {
    name: "Cyril James De Guzman",
    email: "cyril@example.com",
    contactNumber: "09000000000",
    linkedin: "",
    github: "",
    personalWebsite: "",
    educations: [],
    experiences: [
      {
        jobTitle: "Engineer",
        companyName: "Example",
        location: "Remote",
        employmentType: "",
        startDate: "2026-01",
        endDate: "",
        isCurrent: true,
        skills: [],
        bullets: [
          { text: "Keep first" },
          { text: "Remove" },
          { text: "Keep last" },
        ],
      },
    ],
    projects: [],
    skillGroups: [
      { label: "Frontend", skills: ["React", "Next.js", "TypeScript"] },
      { label: "Backend", skills: ["Node.js"] },
    ],
  };
  const filtered = filterResumeContent(
    profile,
    new Set(["0:1"]),
    new Set(["0:1", "1:0"]),
    { 0: [2, 1, 0] },
    { 0: [2, 0, 1] },
  );

  assert.deepEqual(filtered.experiences[0]?.bullets, [
    { text: "Keep last" },
    { text: "Keep first" },
  ]);
  assert.deepEqual(filtered.skillGroups, [
    { label: "Frontend", skills: ["TypeScript", "React"] },
  ]);
  assert.equal(profile.experiences[0]?.bullets.length, 3);
});

const tailorProfile = {
  name: "Cyril James De Guzman",
  email: "cyril@example.com",
  contactNumber: "09000000000",
  linkedin: "",
  github: "",
  personalWebsite: "",
  educations: [],
  experiences: [
    {
      jobTitle: "Engineer",
      companyName: "Example",
      location: "Remote",
      employmentType: "",
      startDate: "2026-01",
      endDate: "",
      isCurrent: true,
      skills: [],
      bullets: [{ text: "Shipped A" }, { text: "Shipped B" }],
    },
    {
      jobTitle: "Intern",
      companyName: "Example",
      location: "Remote",
      employmentType: "",
      startDate: "2025-01",
      endDate: "2025-06",
      isCurrent: false,
      skills: [],
      bullets: [{ text: "Wrote docs" }],
    },
  ],
  projects: [
    {
      projectName: "Side project",
      skills: [],
      bullets: [{ text: "Built it" }],
      isCurrent: false,
      startDate: "2025-01",
      endDate: "2025-02",
    },
  ],
  skillGroups: [
    { label: "Frontend", skills: ["React", "Next.js"] },
    { label: "Backend", skills: ["Node.js"] },
  ],
};

test("reads the model reply out of code fences and chatter", () => {
  assert.deepEqual(
    parseJsonObject('Sure!\n```json\n{"experiences": []}\n```'),
    { experiences: [] },
  );
  assert.equal(parseJsonObject("no json here"), null);
  assert.equal(parseJsonObject("{ not json }"), null);
});

test("filters bullets to the profile but only reorders skills", () => {
  const tailored = reconcileTailoredResume(tailorProfile, {
    experiences: [
      // Reordered, one invented, one duplicated, one reworded.
      {
        id: "exp-0",
        bullets: ["shipped b", "Invented bullet", "Shipped B", "Shipped A!"],
      },
      { id: "exp-1", bullets: [] },
      { id: "exp-9", bullets: ["Shipped A"] },
    ],
    // The model dropped React and skipped the Backend group entirely.
    skillGroups: [{ id: "skill-0", skills: ["next.js", "Invented skill"] }],
  });

  assert.deepEqual(tailored.experiences, [
    { companyName: "Example", jobTitle: "Engineer", bullets: ["Shipped B"] },
    { companyName: "Example", jobTitle: "Intern", bullets: [] },
  ]);
  assert.deepEqual(tailored.projects, []);
  // No skill is ever lost: picks first, then the rest in their original order.
  assert.deepEqual(tailored.skillGroups, [
    { label: "Frontend", skills: ["Next.js", "React"] },
    { label: "Backend", skills: ["Node.js"] },
  ]);
});

test("renders labels only until a tailored result arrives", () => {
  const empty = applyTailoredResume(tailorProfile, null);

  assert.deepEqual(empty.experiences, []);
  assert.deepEqual(empty.skillGroups, []);
  assert.deepEqual(empty.projects, []);
  assert.equal(empty.name, tailorProfile.name);

  const tailored = applyTailoredResume(tailorProfile, {
    experiences: [
      { companyName: "Example", jobTitle: "Engineer", bullets: ["Shipped B"] },
      { companyName: "Example", jobTitle: "Intern", bullets: [] },
    ],
    projects: [
      { projectName: "Side project", bullets: ["Built it for production"] },
    ],
    skillGroups: [
      { label: "Frontend", skills: ["Next.js"] },
      { label: "Backend", skills: [] },
    ],
  });

  assert.deepEqual(tailored.experiences[0]?.bullets, [{ text: "Shipped B" }]);
  assert.equal(tailored.experiences.length, 1);
  assert.deepEqual(tailored.projects[0]?.bullets, [
    { text: "Built it for production" },
  ]);
  assert.deepEqual(tailored.skillGroups[0]?.skills, ["Next.js"]);
  assert.equal(tailorProfile.experiences[0]?.bullets.length, 2);
});
