import * as assert from "node:assert/strict";
import { test } from "node:test";

import type { CareerProfileValues } from "../../../../src/modules/career-profile/career-profile.contract";
import type { CareerProfileService } from "../../../../src/modules/career-profile/career-profile.service";
import { CareerProfileTools } from "../../../../src/modules/chatbot/tools/career-profile.tools";
import type { WriteTool } from "../../../../src/modules/chatbot/tools/tool.types";

const USER = "user-1";

function profile(
  overrides: Partial<CareerProfileValues> = {},
): CareerProfileValues {
  return {
    name: "Cyril",
    email: "cyril@example.com",
    contactNumber: "09170000000",
    linkedin: "",
    github: "",
    personalWebsite: "",
    educations: [],
    skillGroups: [
      { label: "Backend", skills: ["NestJS", "Prisma"] },
      { label: "Frontend", skills: ["React"] },
    ],
    experiences: [],
    projects: [],
    ...overrides,
  };
}

function harness(initial: CareerProfileValues | null = profile()) {
  let stored = initial;
  const service = {
    get: async () => stored,
    save: async (_userId: string, values: CareerProfileValues) => {
      stored = values;
      return values;
    },
  } as unknown as CareerProfileService;

  const tools = new CareerProfileTools(service);
  const byName = new Map(tools.tools().map((tool) => [tool.name, tool]));

  return {
    saved: () => stored,
    // biome-ignore lint/suspicious/noExplicitAny: test helper over a mixed registry
    write: (name: string) => byName.get(name) as WriteTool<any, any>,
    // biome-ignore lint/suspicious/noExplicitAny: test helper over a mixed registry
    read: (name: string) => byName.get(name) as any,
  };
}

test("reads only the sections that were asked for", async () => {
  const app = harness();
  const result = await app.read("career_profile.get").run(USER, {
    sections: ["skillGroups"],
  });

  assert.deepEqual(Object.keys(result as object), ["skillGroups"]);
});

test("update_personal changes only the fields sent", async () => {
  const app = harness();
  const tool = app.write("career_profile.update_personal");

  await tool.run(USER, {}, { contactNumber: "09171111111" });

  assert.equal(app.saved()?.contactNumber, "09171111111");
  assert.equal(app.saved()?.name, "Cyril");
  assert.equal(app.saved()?.email, "cyril@example.com");
});

test("adds one skill to one named group without touching the others", async () => {
  const app = harness();
  const tool = app.write("career_profile.add_item");

  await tool.run(
    USER,
    { section: "skills" },
    { group: "Backend", name: "Zod" },
  );

  assert.deepEqual(app.saved()?.skillGroups[0].skills, [
    "NestJS",
    "Prisma",
    "Zod",
  ]);
  assert.deepEqual(app.saved()?.skillGroups[1].skills, ["React"]);
});

test("removes one skill from one group", async () => {
  const app = harness();
  const tool = app.write("career_profile.remove_item");

  await tool.run(
    USER,
    { section: "skills", target: { group: "Backend", match: "Prisma" } },
    {},
  );

  assert.deepEqual(app.saved()?.skillGroups[0].skills, ["NestJS"]);
});

test("matches a target case-insensitively and by partial name", async () => {
  const app = harness();
  const tool = app.write("career_profile.update_item");

  await tool.run(
    USER,
    { section: "skillGroups", target: { match: "backend" } },
    { label: "Backend & APIs" },
  );

  assert.equal(app.saved()?.skillGroups[0].label, "Backend & APIs");
  assert.deepEqual(app.saved()?.skillGroups[0].skills, ["NestJS", "Prisma"]);
});

test("rejects a target that matches nothing instead of writing", async () => {
  const app = harness();
  const tool = app.write("career_profile.remove_item");

  await assert.rejects(
    () =>
      tool.run(
        USER,
        { section: "skills", target: { group: "Nope", match: "Zod" } },
        {},
      ),
    /No skill group/,
  );
  assert.deepEqual(app.saved()?.skillGroups[0].skills, ["NestJS", "Prisma"]);
});

test("refuses a patch that breaks a whole-profile rule", async () => {
  const app = harness();
  const tool = app.write("career_profile.add_item");

  await assert.rejects(
    () =>
      tool.run(
        USER,
        { section: "experiences" },
        {
          jobTitle: "Engineer",
          companyName: "Acme",
          location: "Manila",
          startDate: "2024-01",
          endDate: "2024-06",
          isCurrent: false,
          skills: ["Haskell"],
          bullets: ["Shipped things"],
        },
      ),
    /skill group/i,
  );
  assert.equal(app.saved()?.experiences.length, 0);
});

test("drops keys the model invented", async () => {
  const app = harness();
  const tool = app.write("career_profile.update_personal");

  await tool.run(USER, {}, { name: "Quinch", isAdmin: true });

  assert.equal(app.saved()?.name, "Quinch");
  assert.equal("isAdmin" in (app.saved() as object), false);
});

test("a write on an empty profile asks for personal details first", async () => {
  const app = harness(null);
  const tool = app.write("career_profile.add_item");

  await assert.rejects(
    () => tool.prepare(USER, { section: "educations", values: {} }),
    /personal details/i,
  );
});

test("prepare prefills stored values and overlays what the model heard", async () => {
  const app = harness();
  const form = await app
    .write("career_profile.update_personal")
    .prepare(USER, { values: { name: "Quinch", nonsense: 1 } });

  assert.equal(form.values.name, "Quinch");
  assert.equal(form.values.email, "cyril@example.com");
  assert.equal("nonsense" in form.values, false);
  assert.equal(form.domain, "career-profile");
});
