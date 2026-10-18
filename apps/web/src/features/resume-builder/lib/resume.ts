import type { TailorSelection } from "@/features/resume-builder/validations/build-resume";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";

/** What `POST /api/build-resume` returns: positionally aligned to the career
 * profile's `experiences` and `skillGroups`, so every experience and every
 * skill group is present even when nothing in it was selected. */
export interface TailoredResume {
  experiences: { companyName: string; jobTitle: string; bullets: string[] }[];
  projects: { projectName: string; bullets: string[] }[];
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
    projects: [],
    skillGroups: source.skillGroups.map((group, index) => ({
      label: group.label,
      skills: orderKnown(group.skills, skillsById.get(`skill-${index}`), true),
    })),
  };
}

/** Merge the stateless tailor result into the stored profile for rendering. */
export function applyTailoredResume(
  profile: CareerProfileValues,
  tailored: TailoredResume | null | undefined,
): CareerProfileValues {
  return {
    ...profile,
    experiences: profile.experiences
      .map((experience, index) => ({
        ...experience,
        bullets: (tailored?.experiences[index]?.bullets ?? []).map((text) => ({
          text,
        })),
      }))
      .filter((experience) => experience.bullets.length > 0),
    projects: profile.projects
      .map((project, index) => ({
        ...project,
        bullets: (tailored?.projects[index]?.bullets ?? []).map((text) => ({
          text,
        })),
      }))
      .filter((project) => project.bullets.length > 0),
    skillGroups: profile.skillGroups
      .map((group, index) => ({
        ...group,
        skills: tailored?.skillGroups[index]?.skills ?? [],
      }))
      .filter((group) => group.skills.length > 0),
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

/** Default contact order on the PDF header. */
export const RESUME_CONTACT_FIELDS = [
  "email",
  "linkedin",
  "personalWebsite",
  "github",
  "contactNumber",
] as const;

export type ResumeContactField = (typeof RESUME_CONTACT_FIELDS)[number];

/** The profile as rendered: the builder can also reorder contacts. */
export type ResumeProfile = CareerProfileValues & {
  contactOrder?: ResumeContactField[];
};

/** Picks and orders items by index, skipping excluded `${prefix}:${index}` keys. */
function pick<T>(
  items: readonly T[],
  prefix: string,
  excluded: ReadonlySet<string>,
  order: Readonly<Record<string, readonly number[]>>,
): T[] {
  return getResumeItemOrder(items.length, order[prefix])
    .filter((index) => !excluded.has(`${prefix}:${index}`))
    .flatMap((index) => (index in items ? [items[index] as T] : []));
}

/**
 * Applies the builder's choices. Hide keys: `section:<contact|skill|exp|proj|edu>`
 * for a whole section, `exp:<i>` / `proj:<i>` / `skill:<i>` for a whole entry,
 * `contact:<i>` (index into RESUME_CONTACT_FIELDS), `edu:<i>`,
 * `exp:<i>:<j>`, `proj:<i>:<j>`, `skill:<i>:<j>`; `order` uses the same
 * prefixes without the last index (`edu`, `exp:<i>`, ...).
 */
export function filterResumeContent(
  profile: CareerProfileValues,
  excluded: ReadonlySet<string>,
  order: Readonly<Record<string, readonly number[]>> = {},
): ResumeProfile {
  const shown = (section: string) => !excluded.has(`section:${section}`);
  const contacts = Object.fromEntries(
    RESUME_CONTACT_FIELDS.map((field, i) => [
      field,
      shown("contact") && !excluded.has(`contact:${i}`) ? profile[field] : "",
    ]),
  );
  return {
    ...profile,
    ...contacts,
    contactOrder: getResumeItemOrder(
      RESUME_CONTACT_FIELDS.length,
      order.contact,
    ).map((i) => RESUME_CONTACT_FIELDS[i] as ResumeContactField),
    educations: shown("edu")
      ? pick(profile.educations, "edu", excluded, order)
      : [],
    experiences: shown("exp")
      ? profile.experiences.flatMap((experience, i) =>
          excluded.has(`exp:${i}`)
            ? []
            : [
                {
                  ...experience,
                  bullets: pick(
                    experience.bullets,
                    `exp:${i}`,
                    excluded,
                    order,
                  ),
                },
              ],
        )
      : [],
    projects: shown("proj")
      ? profile.projects.flatMap((project, i) =>
          excluded.has(`proj:${i}`)
            ? []
            : [
                {
                  ...project,
                  bullets: pick(project.bullets, `proj:${i}`, excluded, order),
                },
              ],
        )
      : [],
    skillGroups: shown("skill")
      ? profile.skillGroups
          .flatMap((group, i) =>
            excluded.has(`skill:${i}`)
              ? []
              : [
                  {
                    ...group,
                    skills: pick(group.skills, `skill:${i}`, excluded, order),
                  },
                ],
          )
          .filter((group) => group.skills.length > 0)
      : [],
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
