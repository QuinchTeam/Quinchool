import type { ToolField } from "./tool.types";

/**
 * Every addressable list in a career profile, flat.
 *
 * Nested lists — the bullets on one experience, the skills in one group — are
 * sections in their own right rather than special cases, so "delete the third
 * bullet from my PioneerDev role" costs an entry in this table and no new tool.
 */
export const LIST_SECTIONS = [
  "educations",
  "skillGroups",
  "skills",
  "experiences",
  "experienceBullets",
  "experienceSkills",
  "projects",
  "projectBullets",
  "projectSkills",
] as const;

export type ListSection = (typeof LIST_SECTIONS)[number];

/** Where a nested section lives, and what one of its entries looks like. */
export interface NestedSpec {
  /** The section holding the parent entry. */
  parent: "skillGroups" | "experiences" | "projects";
  /** The parent's field holding this list. */
  field: "skills" | "bullets";
  /** `string` lists hold bare text; `text` lists hold `{ text }` objects. */
  kind: "string" | "text";
  parentLabel: string;
}

export interface SectionSpec {
  /** Used in form titles and error messages. */
  label: string;
  fields: ToolField[];
  nested?: NestedSpec;
}

const PARENT_FIELD = (label: string): ToolField => ({
  name: "parent",
  label,
  type: "text",
  required: true,
});

const TEXT_FIELD: ToolField = {
  name: "text",
  label: "Text",
  type: "textarea",
  required: true,
};

const NAME_FIELD: ToolField = {
  name: "name",
  label: "Name",
  type: "text",
  required: true,
};

const DATED_ENTRY: ToolField[] = [
  { name: "startDate", label: "Start", type: "month", required: true },
  { name: "endDate", label: "End", type: "month" },
];

export const PERSONAL_FIELDS: ToolField[] = [
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

export const SECTIONS: Record<ListSection, SectionSpec> = {
  educations: {
    label: "education",
    fields: [
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
  },
  skillGroups: {
    label: "skill group",
    fields: [
      { name: "label", label: "Group name", type: "text", required: true },
      { name: "skills", label: "Skills", type: "list", itemLabel: "Skill" },
    ],
  },
  skills: {
    label: "skill",
    fields: [PARENT_FIELD("Skill group"), NAME_FIELD],
    nested: {
      parent: "skillGroups",
      field: "skills",
      kind: "string",
      parentLabel: "skill group",
    },
  },
  experiences: {
    label: "experience",
    fields: [
      { name: "jobTitle", label: "Job title", type: "text", required: true },
      { name: "companyName", label: "Company", type: "text", required: true },
      { name: "location", label: "Location", type: "text", required: true },
      { name: "employmentType", label: "Employment type", type: "text" },
      ...DATED_ENTRY,
      { name: "isCurrent", label: "I currently work here", type: "checkbox" },
      { name: "skills", label: "Skills", type: "list", itemLabel: "Skill" },
      {
        name: "bullets",
        label: "Bullets",
        type: "list",
        itemLabel: "Bullet",
      },
    ],
  },
  experienceBullets: {
    label: "bullet",
    fields: [PARENT_FIELD("Experience"), TEXT_FIELD],
    nested: {
      parent: "experiences",
      field: "bullets",
      kind: "text",
      parentLabel: "experience",
    },
  },
  experienceSkills: {
    label: "experience skill",
    fields: [PARENT_FIELD("Experience"), NAME_FIELD],
    nested: {
      parent: "experiences",
      field: "skills",
      kind: "string",
      parentLabel: "experience",
    },
  },
  projects: {
    label: "project",
    fields: [
      { name: "projectName", label: "Project", type: "text", required: true },
      ...DATED_ENTRY,
      { name: "isCurrent", label: "Still working on it", type: "checkbox" },
      { name: "skills", label: "Skills", type: "list", itemLabel: "Skill" },
      {
        name: "bullets",
        label: "Bullets",
        type: "list",
        itemLabel: "Bullet",
      },
    ],
  },
  projectBullets: {
    label: "bullet",
    fields: [PARENT_FIELD("Project"), TEXT_FIELD],
    nested: {
      parent: "projects",
      field: "bullets",
      kind: "text",
      parentLabel: "project",
    },
  },
  projectSkills: {
    label: "project skill",
    fields: [PARENT_FIELD("Project"), NAME_FIELD],
    nested: {
      parent: "projects",
      field: "skills",
      kind: "string",
      parentLabel: "project",
    },
  },
};

/** How an entry is named when a model refers to it in conversation. */
export function labelOf(entry: unknown): string {
  if (typeof entry === "string") {
    return entry;
  }

  const record = entry as Record<string, unknown>;

  return String(
    record.institutionName ??
      record.label ??
      record.companyName ??
      record.projectName ??
      record.name ??
      record.text ??
      "",
  );
}
