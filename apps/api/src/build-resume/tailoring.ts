/**
 * Turning the model's picks back into a resume. Copied from
 * apps/web/src/lib/resume.ts, which keeps the rendering half of that file.
 */

import type { TailorSelection } from "./build-resume.contract";

/** What `POST /build-resume` returns: positionally aligned to the career
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
