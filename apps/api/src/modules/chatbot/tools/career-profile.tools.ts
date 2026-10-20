import { Injectable } from "@nestjs/common";
import { z } from "zod";

import {
  type CareerProfileValues,
  careerProfileSchema,
} from "../../career-profile/career-profile.contract";
import { CareerProfileService } from "../../career-profile/career-profile.service";
import {
  type AnyTool,
  type ToolField,
  ToolExecutionError,
  type ToolForm,
} from "./tool.types";

const DOMAIN = "career-profile";

const LIST_SECTIONS = [
  "educations",
  "skillGroups",
  "skills",
  "experiences",
  "projects",
] as const;

type ListSection = (typeof LIST_SECTIONS)[number];

const listSection = z.enum(LIST_SECTIONS);

const targetSchema = z.object({
  index: z.number().int().min(0).optional(),
  match: z.string().trim().min(1).optional(),
  // Only skill targets use the group field.
  group: z.string().trim().min(1).optional(),
});

type Target = z.infer<typeof targetSchema>;

// The submitted confirmation overrides the model's suggested values.
const looseValues = z.record(z.string(), z.unknown()).default({});

const EMPTY_PROFILE: CareerProfileValues = {
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
};

const PERSONAL_FIELDS: ToolField[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  {
    name: "contactNumber",
    label: "Contact number",
    type: "text",
    required: true,
  },
  { name: "linkedin", label: "LinkedIn", type: "text" },
  { name: "github", label: "GitHub", type: "text" },
  { name: "personalWebsite", label: "Personal website", type: "text" },
];

const SECTION_FIELDS: Record<ListSection, ToolField[]> = {
  educations: [
    {
      name: "institutionName",
      label: "Institution",
      type: "text",
      required: true,
    },
    { name: "location", label: "Location", type: "text", required: true },
    { name: "degree", label: "Degree", type: "text", required: true },
    {
      name: "fieldOfStudy",
      label: "Field of study",
      type: "text",
      required: true,
    },
    { name: "specialization", label: "Specialization", type: "text" },
    { name: "startDate", label: "Start", type: "month", required: true },
    { name: "endDate", label: "End", type: "month", required: true },
  ],
  skillGroups: [
    { name: "label", label: "Group name", type: "text", required: true },
    { name: "skills", label: "Skills", type: "list", itemLabel: "Skill" },
  ],
  skills: [
    { name: "group", label: "Skill group", type: "text", required: true },
    { name: "name", label: "Skill", type: "text", required: true },
  ],
  experiences: [
    { name: "jobTitle", label: "Job title", type: "text", required: true },
    { name: "companyName", label: "Company", type: "text", required: true },
    { name: "location", label: "Location", type: "text", required: true },
    { name: "employmentType", label: "Employment type", type: "text" },
    { name: "startDate", label: "Start", type: "month", required: true },
    { name: "endDate", label: "End", type: "month" },
    { name: "isCurrent", label: "I currently work here", type: "checkbox" },
    { name: "skills", label: "Skills", type: "list", itemLabel: "Skill" },
    {
      name: "bullets",
      label: "Highlights",
      type: "list",
      itemLabel: "Highlight",
    },
  ],
  projects: [
    { name: "projectName", label: "Project", type: "text", required: true },
    { name: "startDate", label: "Start", type: "month", required: true },
    { name: "endDate", label: "End", type: "month" },
    { name: "isCurrent", label: "Still working on it", type: "checkbox" },
    { name: "skills", label: "Skills", type: "list", itemLabel: "Skill" },
    {
      name: "bullets",
      label: "Highlights",
      type: "list",
      itemLabel: "Highlight",
    },
  ],
};

const SECTION_LABELS: Record<ListSection, string> = {
  educations: "education",
  skillGroups: "skill group",
  skills: "skill",
  experiences: "experience",
  projects: "project",
};

@Injectable()
export class CareerProfileTools {
  constructor(private readonly careerProfile: CareerProfileService) {}

  tools(): AnyTool[] {
    return [
      this.get(),
      this.updatePersonal(),
      this.addItem(),
      this.updateItem(),
      this.removeItem(),
    ];
  }

  private get(): AnyTool {
    const sections = z
      .array(
        z.enum([
          "personal",
          "educations",
          "skillGroups",
          "skills",
          "experiences",
          "projects",
        ]),
      )
      .optional();

    return {
      name: "career_profile.get",
      kind: "read",
      arguments: z.object({ sections }),
      run: async (userId, args: { sections?: string[] }) => {
        const profile = await this.careerProfile.get(userId);

        if (!profile) {
          return null;
        }

        const wanted = new Set(args.sections ?? []);

        if (wanted.size === 0) {
          return profile;
        }

        const slice: Record<string, unknown> = {};

        if (wanted.has("personal")) {
          slice.personal = {
            name: profile.name,
            email: profile.email,
            contactNumber: profile.contactNumber,
            linkedin: profile.linkedin,
            github: profile.github,
            personalWebsite: profile.personalWebsite,
          };
        }

        // skills is a view over skillGroups, not a separate stored list.
        if (wanted.has("skills") || wanted.has("skillGroups")) {
          slice.skillGroups = profile.skillGroups;
        }

        for (const section of ["educations", "experiences", "projects"]) {
          if (wanted.has(section)) {
            slice[section] = profile[section as keyof CareerProfileValues];
          }
        }

        return slice;
      },
    };
  }

  private updatePersonal(): AnyTool {
    return {
      name: "career_profile.update_personal",
      kind: "write",
      arguments: z.object({ values: looseValues }),
      values: z.record(z.string(), z.unknown()),
      prepare: async (userId, args: { values: Record<string, unknown> }) => {
        const profile = await this.load(userId);

        return {
          domain: DOMAIN,
          title: "Update personal details",
          description: "Check these before they are saved.",
          fields: PERSONAL_FIELDS,
          // Prefill the form with the requested changes over the stored values.
          values: {
            name: profile.name,
            email: profile.email,
            contactNumber: profile.contactNumber,
            linkedin: profile.linkedin,
            github: profile.github,
            personalWebsite: profile.personalWebsite,
            ...pick(args.values, PERSONAL_FIELDS),
          },
          submitLabel: "Save details",
        } satisfies ToolForm;
      },
      run: async (userId, _args, values: Record<string, unknown>) =>
        this.apply(userId, (profile) => ({
          ...profile,
          ...pick(values, PERSONAL_FIELDS),
        })),
    };
  }

  private addItem(): AnyTool {
    return {
      name: "career_profile.add_item",
      kind: "write",
      arguments: z.object({ section: listSection, values: looseValues }),
      values: z.record(z.string(), z.unknown()),
      prepare: async (
        userId,
        args: { section: ListSection; values: Record<string, unknown> },
      ) => {
        const profile = await this.load(userId);
        this.requirePersonalDetails(profile, args.section);

        return {
          domain: DOMAIN,
          title: `Add ${SECTION_LABELS[args.section]}`,
          description: "Fill in anything missing before it is saved.",
          fields: SECTION_FIELDS[args.section],
          values: pick(args.values, SECTION_FIELDS[args.section]),
          submitLabel: "Add",
        } satisfies ToolForm;
      },
      run: async (
        userId,
        args: { section: ListSection },
        values: Record<string, unknown>,
      ) =>
        this.apply(userId, (profile) =>
          this.insert(profile, args.section, values),
        ),
    };
  }

  private updateItem(): AnyTool {
    return {
      name: "career_profile.update_item",
      kind: "write",
      arguments: z.object({
        section: listSection,
        target: targetSchema,
        values: looseValues,
      }),
      values: z.record(z.string(), z.unknown()),
      prepare: async (
        userId,
        args: {
          section: ListSection;
          target: Target;
          values: Record<string, unknown>;
        },
      ) => {
        const profile = await this.load(userId);
        const current = this.locate(profile, args.section, args.target);

        return {
          domain: DOMAIN,
          title: `Update ${SECTION_LABELS[args.section]}`,
          description: "Change what you need, the rest stays as it is.",
          fields: SECTION_FIELDS[args.section],
          values: {
            ...current.values,
            ...pick(args.values, SECTION_FIELDS[args.section]),
          },
          submitLabel: "Save changes",
        } satisfies ToolForm;
      },
      run: async (
        userId,
        args: { section: ListSection; target: Target },
        values: Record<string, unknown>,
      ) =>
        this.apply(userId, (profile) => {
          const found = this.locate(profile, args.section, args.target);
          return this.replace(profile, args.section, found, values);
        }),
    };
  }

  private removeItem(): AnyTool {
    return {
      name: "career_profile.remove_item",
      kind: "write",
      arguments: z.object({ section: listSection, target: targetSchema }),
      values: z.record(z.string(), z.unknown()),
      prepare: async (
        userId,
        args: { section: ListSection; target: Target },
      ) => {
        const profile = await this.load(userId);
        const found = this.locate(profile, args.section, args.target);

        return {
          domain: DOMAIN,
          title: `Delete ${SECTION_LABELS[args.section]}`,
          description: `"${found.label}" will be removed from your profile.`,
          fields: [],
          values: {},
          submitLabel: "Delete",
          destructive: true,
        } satisfies ToolForm;
      },
      run: async (userId, args: { section: ListSection; target: Target }) =>
        this.apply(userId, (profile) => {
          const found = this.locate(profile, args.section, args.target);
          return this.remove(profile, args.section, found);
        }),
    };
  }

  private async load(userId: string): Promise<CareerProfileValues> {
    return (await this.careerProfile.get(userId)) ?? EMPTY_PROFILE;
  }

  // Validate the patched profile as a whole because skills have cross-section rules.
  private async apply(
    userId: string,
    patch: (profile: CareerProfileValues) => CareerProfileValues,
  ): Promise<CareerProfileValues> {
    const current = await this.load(userId);
    const parsed = careerProfileSchema.safeParse(patch(current));

    if (!parsed.success) {
      const [issue] = parsed.error.issues;
      throw new ToolExecutionError(
        issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid profile",
      );
    }

    return this.careerProfile.save(userId, parsed.data);
  }

  private requirePersonalDetails(
    profile: CareerProfileValues,
    section: ListSection,
  ): void {
    if (section !== "skills" && !profile.name) {
      throw new ToolExecutionError(
        "Add your personal details first, then this can be saved.",
      );
    }
  }

  private locate(
    profile: CareerProfileValues,
    section: ListSection,
    target: Target,
  ): Located {
    if (section === "skills") {
      const groupIndex = matchIndex(
        profile.skillGroups.map((group) => group.label),
        { match: target.group ?? target.match },
      );

      if (groupIndex < 0) {
        throw new ToolExecutionError(
          `No skill group called "${target.group ?? target.match}".`,
        );
      }

      const group = profile.skillGroups[groupIndex];
      const skillIndex = matchIndex(group.skills, target);

      if (skillIndex < 0) {
        throw new ToolExecutionError(
          `"${group.label}" has no skill called "${target.match}".`,
        );
      }

      return {
        index: skillIndex,
        groupIndex,
        label: group.skills[skillIndex],
        values: { group: group.label, name: group.skills[skillIndex] },
      };
    }

    const entries = profile[section];
    const index = matchIndex(entries.map(labelOf), target);

    if (index < 0) {
      throw new ToolExecutionError(
        `No ${SECTION_LABELS[section]} matching "${target.match ?? target.index}".`,
      );
    }

    const entry = entries[index] as Record<string, unknown>;

    return {
      index,
      label: labelOf(entry),
      values: {
        ...entry,
        bullets: toStringList(entry.bullets),
      },
    };
  }

  private insert(
    profile: CareerProfileValues,
    section: ListSection,
    values: Record<string, unknown>,
  ): CareerProfileValues {
    if (section === "skills") {
      const label = String(values.group ?? "").trim();
      const name = String(values.name ?? "").trim();
      const index = matchIndex(
        profile.skillGroups.map((group) => group.label),
        { match: label },
      );

      if (index < 0) {
        throw new ToolExecutionError(`No skill group called "${label}".`);
      }

      return {
        ...profile,
        skillGroups: profile.skillGroups.map((group, at) =>
          at === index ? { ...group, skills: [...group.skills, name] } : group,
        ),
      };
    }

    return {
      ...profile,
      [section]: [...profile[section], shape(section, values)],
    } as CareerProfileValues;
  }

  private replace(
    profile: CareerProfileValues,
    section: ListSection,
    found: Located,
    values: Record<string, unknown>,
  ): CareerProfileValues {
    if (section === "skills") {
      const groupIndex = found.groupIndex ?? -1;
      const name = String(values.name ?? found.label).trim();

      return {
        ...profile,
        skillGroups: profile.skillGroups.map((group, at) =>
          at === groupIndex
            ? {
                ...group,
                skills: group.skills.map((skill, position) =>
                  position === found.index ? name : skill,
                ),
              }
            : group,
        ),
      };
    }

    return {
      ...profile,
      [section]: profile[section].map((entry, at) =>
        at === found.index
          ? shape(section, { ...found.values, ...values })
          : entry,
      ),
    } as CareerProfileValues;
  }

  private remove(
    profile: CareerProfileValues,
    section: ListSection,
    found: Located,
  ): CareerProfileValues {
    if (section === "skills") {
      const groupIndex = found.groupIndex ?? -1;

      return {
        ...profile,
        skillGroups: profile.skillGroups.map((group, at) =>
          at === groupIndex
            ? {
                ...group,
                skills: group.skills.filter(
                  (_skill, position) => position !== found.index,
                ),
              }
            : group,
        ),
      };
    }

    return {
      ...profile,
      [section]: profile[section].filter((_entry, at) => at !== found.index),
    } as CareerProfileValues;
  }
}

interface Located {
  index: number;
  groupIndex?: number;
  label: string;
  values: Record<string, unknown>;
}

function pick(
  values: Record<string, unknown>,
  fields: ToolField[],
): Record<string, unknown> {
  const allowed = new Set(fields.map((field) => field.name));
  return Object.fromEntries(
    Object.entries(values).filter(([key]) => allowed.has(key)),
  );
}

function labelOf(entry: unknown): string {
  const record = entry as Record<string, unknown>;
  return String(
    record.institutionName ??
      record.label ??
      record.companyName ??
      record.projectName ??
      record.name ??
      "",
  );
}

function matchIndex(labels: string[], target: Target): number {
  if (typeof target.index === "number") {
    return target.index < labels.length ? target.index : -1;
  }

  const needle = (target.match ?? "").trim().toLocaleLowerCase();

  if (!needle) {
    return -1;
  }

  const exact = labels.findIndex(
    (label) => label.toLocaleLowerCase() === needle,
  );

  return exact >= 0
    ? exact
    : labels.findIndex((label) => label.toLocaleLowerCase().includes(needle));
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) =>
    typeof item === "string"
      ? item
      : String((item as { text?: unknown })?.text ?? ""),
  );
}

// Convert plain form strings into the profile schema's nested shapes.
function shape(
  section: ListSection,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const entry: Record<string, unknown> = { ...values };

  for (const field of SECTION_FIELDS[section]) {
    if (field.type === "list" && !Array.isArray(entry[field.name])) {
      entry[field.name] = [];
    }
    if (field.type === "checkbox") {
      entry[field.name] = Boolean(entry[field.name]);
    }
    if (field.type === "text" && entry[field.name] === undefined) {
      entry[field.name] = "";
    }
  }

  if (section === "experiences" || section === "projects") {
    entry.bullets = toStringList(entry.bullets)
      .filter((text) => text.trim())
      .map((text) => ({ text }));
    entry.skills = toStringList(entry.skills).filter((skill) => skill.trim());
  }

  if (section === "skillGroups") {
    entry.skills = toStringList(entry.skills).filter((skill) => skill.trim());
  }

  return entry;
}
