import { z } from "zod";

export const JOB_SOURCES = ["LinkedIn", "JobStreet"] as const;
export const JOB_WORK_MODES = ["Remote", "Hybrid", "Onsite"] as const;
export const JOB_TIME_RANGES = [
  "LAST_HOUR",
  "TODAY",
  "THIS_WEEK",
  "CUSTOM",
] as const;

const criterionSchema = z.string().trim().min(1).max(80);
const criteriaSchema = z
  .array(criterionSchema)
  .max(30)
  .transform(uniqueStrings);

/**
 * Every criteria list may be empty: a new account starts with nothing filled
 * in, and a half-finished config is still worth saving. Running a scan is what
 * needs the criteria set — see getUnsetScanCriteria.
 */
export const jobScraperConfigSchema = z
  .object({
    roles: criteriaSchema,
    includedLevels: criteriaSchema,
    requiredTechnologies: criteriaSchema,
    excludedLevels: criteriaSchema,
    excludedTechnologies: criteriaSchema,
    sources: z.array(z.enum(JOB_SOURCES)).min(1).transform(uniqueStrings),
    timeRange: z.enum(JOB_TIME_RANGES),
    customStartDate: z.iso.date().nullable(),
    customEndDate: z.iso.date().nullable(),
    worldwideWorkModes: z
      .array(z.enum(JOB_WORK_MODES))
      .transform(uniqueStrings),
    philippinesWorkModes: z
      .array(z.enum(JOB_WORK_MODES))
      .transform(uniqueStrings),
  })
  .superRefine((value, context) => {
    if (value.timeRange !== "CUSTOM") {
      return;
    }

    if (!value.customStartDate || !value.customEndDate) {
      context.addIssue({
        code: "custom",
        message: "Choose both custom range dates.",
        path: ["customStartDate"],
      });
      return;
    }

    const start = Date.parse(`${value.customStartDate}T00:00:00Z`);
    const end = Date.parse(`${value.customEndDate}T00:00:00Z`);
    const rangeDays = (end - start) / 86_400_000;
    const today = getTodayInManila();
    const earliestDate = shiftDate(today, -6);

    if (
      rangeDays < 0 ||
      rangeDays > 6 ||
      value.customStartDate < earliestDate ||
      value.customEndDate > today
    ) {
      context.addIssue({
        code: "custom",
        message: "Custom range must fall within the latest 7 days.",
        path: ["customEndDate"],
      });
    }
  });

export type JobScraperConfig = z.infer<typeof jobScraperConfigSchema>;

/**
 * The criteria a scan cannot run without, in the words the prompt uses. The API
 * checks the same four before it calls the AI service.
 */
export function getUnsetScanCriteria(config: JobScraperConfig): string[] {
  return [
    config.roles.length === 0 ? "a role" : "",
    config.includedLevels.length === 0 ? "a level" : "",
    config.sources.length === 0 ? "a source" : "",
    config.worldwideWorkModes.length === 0 &&
    config.philippinesWorkModes.length === 0
      ? "a location and work mode"
      : "",
  ].filter(Boolean);
}

export const JOB_CLASSIFICATIONS = ["MATCH", "POTENTIAL", "REJECTED"] as const;

export interface SavedJob {
  classification: (typeof JOB_CLASSIFICATIONS)[number];
  company: string;
  country: string;
  firstSeenAt: string;
  id: string;
  isManualClassification: boolean;
  isNew: boolean;
  lastSeenAt: string;
  level: string;
  location: string;
  matchedSkills: string[];
  postedAt: string | null;
  postedDate: string | null;
  postedText: string | null;
  reviewReasons: string[];
  source: (typeof JOB_SOURCES)[number];
  summary: string;
  title: string;
  url: string;
  workMode: (typeof JOB_WORK_MODES)[number] | "Unclear";
}

export interface JobScraperState {
  classificationCounts: Record<SavedJob["classification"], number>;
  config: JobScraperConfig;
  jobs: SavedJob[];
  lastScannedAt: string | null;
  newJobCount: number;
  savedJobCount: number;
  sourceIssues: JobSourceIssue[];
}

export interface JobSourceIssue {
  message: string;
  source: (typeof JOB_SOURCES)[number];
}

export function getTodayInManila(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Manila",
    year: "numeric",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${read("year")}-${read("month")}-${read("day")}`;
}

function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function uniqueStrings<T extends string>(values: T[]): T[] {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = value.toLowerCase();

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
