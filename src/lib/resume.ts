import type { TailorSelection } from "@/lib/validations/build-resume";
import type { CareerProfileValues } from "@/lib/validations/career-profile";

/** What `POST /api/build-resume` returns: positionally aligned to the career
 * profile's `experiences` and `skillGroups`, so every experience and every
 * skill group is present even when nothing in it was selected. */
export interface TailoredResume {
  experiences: { companyName: string; jobTitle: string; bullets: string[] }[];
  skillGroups: { label: string; skills: string[] }[];
}

interface TailorSource {
  experiences: readonly {
    companyName: string;
    jobTitle: string;
    bullets: readonly { text: string }[];
  }[];
  skillGroups: readonly { label: string; skills: readonly string[] }[];
}

/** Parse the first JSON object in a model reply, tolerating code fences and
 * chatter around it. */
export function parseJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}

/** Put the model's picks in its own order, dropping anything the profile does
 * not actually contain. With `keepRest`, entries the model left out are
 * appended in their original order instead of being cut. */
function orderKnown(
  available: readonly string[],
  chosen: readonly string[] = [],
  keepRest = false,
) {
  const byKey = new Map(
    available.map((value) => [value.trim().toLocaleLowerCase(), value]),
  );
  const ordered = [
    ...new Set(chosen.map((value) => value.trim().toLocaleLowerCase())),
  ]
    .map((key) => byKey.get(key))
    .filter((value) => value !== undefined);

  if (!keepRest) return ordered;

  const taken = new Set(ordered);

  return [...ordered, ...available.filter((value) => !taken.has(value))];
}

/** Keep only the bullets the profile actually contains, in the model's order,
 * so a reworded or hallucinated bullet is dropped. Skills are only reordered:
 * every skill of every group survives, relevant ones first. */
export function reconcileTailoredResume(
  source: TailorSource,
  selection: TailorSelection,
): TailoredResume {
  const bulletsById = new Map(
    (selection.experiences ?? []).map((entry) => [entry.id, entry.bullets]),
  );
  const skillsById = new Map(
    (selection.skillGroups ?? []).map((entry) => [entry.id, entry.skills]),
  );

  return {
    experiences: source.experiences.map((experience, index) => ({
      companyName: experience.companyName,
      jobTitle: experience.jobTitle,
      bullets: orderKnown(
        experience.bullets.map((bullet) => bullet.text),
        bulletsById.get(`exp-${index}`),
      ),
    })),
    skillGroups: source.skillGroups.map((group, index) => ({
      label: group.label,
      skills: orderKnown(group.skills, skillsById.get(`skill-${index}`), true),
    })),
  };
}

/** Career profile as the tailor renders it: personal details, education and
 * skill-group labels always; bullets and skills only once the model has picked
 * them. Projects are left out — the tailor only ranks experiences and skills. */
export function applyTailoredResume(
  profile: CareerProfileValues,
  tailored: TailoredResume | null | undefined,
): CareerProfileValues {
  return {
    ...profile,
    experiences: profile.experiences.map((experience, index) => ({
      ...experience,
      bullets: (tailored?.experiences[index]?.bullets ?? []).map((text) => ({
        text,
      })),
    })),
    projects: [],
    skillGroups: profile.skillGroups.map((group, index) => ({
      ...group,
      skills: tailored?.skillGroups[index]?.skills ?? [],
    })),
  };
}

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDateRange(
  startDate: string,
  endDate: string,
  isCurrent: boolean,
) {
  const formatMonth = (month: string) =>
    monthFormatter.format(new Date(`${month}-01T00:00:00.000Z`));

  return `${formatMonth(startDate)} - ${
    isCurrent ? "Present" : formatMonth(endDate)
  }`;
}

export function displayUrl(value: string) {
  const url = new URL(value);
  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");

  return `${url.host.replace(/^www\./, "")}${path}`;
}

export function resumeFileName(name: string) {
  const base = name
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "");

  return `${base || "resume"}-resume.pdf`;
}

export function filterResumeContent(
  profile: CareerProfileValues,
  excludedBullets: ReadonlySet<string>,
  excludedSkills: ReadonlySet<string>,
  bulletOrder: Readonly<Record<number, readonly number[]>> = {},
  skillOrder: Readonly<Record<number, readonly number[]>> = {},
): CareerProfileValues {
  return {
    ...profile,
    experiences: profile.experiences.map((experience, experienceIndex) => ({
      ...experience,
      bullets: getResumeItemOrder(
        experience.bullets.length,
        bulletOrder[experienceIndex],
      )
        .filter(
          (bulletIndex) =>
            !excludedBullets.has(`${experienceIndex}:${bulletIndex}`),
        )
        .flatMap((bulletIndex) => {
          const bullet = experience.bullets[bulletIndex];
          return bullet ? [bullet] : [];
        }),
    })),
    skillGroups: profile.skillGroups
      .map((group, groupIndex) => ({
        ...group,
        skills: getResumeItemOrder(group.skills.length, skillOrder[groupIndex])
          .filter(
            (skillIndex) => !excludedSkills.has(`${groupIndex}:${skillIndex}`),
          )
          .flatMap((skillIndex) => {
            const skill = group.skills[skillIndex];
            return skill === undefined ? [] : [skill];
          }),
      }))
      .filter((group) => group.skills.length > 0),
  };
}

export function getResumeItemOrder(
  length: number,
  preferredOrder: readonly number[] = [],
) {
  const originalOrder = Array.from({ length }, (_, index) => index);

  return [
    ...new Set([
      ...preferredOrder.filter((index) => index >= 0 && index < length),
      ...originalOrder,
    ]),
  ];
}
