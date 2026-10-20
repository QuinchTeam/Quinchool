import { z } from "zod";

export const JOB_SOURCES = ["LinkedIn", "JobStreet"] as const;
export const JOB_WORK_MODES = ["Remote", "Hybrid", "Onsite"] as const;
export const JOB_TIME_RANGES = [
  "LAST_HOUR",
  "TODAY",
  "THIS_WEEK",
  "CUSTOM",
] as const;
export const JOB_CLASSIFICATIONS = ["MATCH", "POTENTIAL", "REJECTED"] as const;

const criterionSchema = z.string().trim().min(1).max(80);
const criteriaSchema = z
  .array(criterionSchema)
  .max(30)
  .transform(uniqueStrings);

// Empty criteria can be saved; scan readiness is checked separately.
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

    // Saved ranges may be older than seven days; scanning only checks their order.
    if (value.customStartDate > value.customEndDate) {
      context.addIssue({
        code: "custom",
        message: "Custom range must start on or before it ends.",
        path: ["customEndDate"],
      });
    }
  });

export type JobScraperConfig = z.infer<typeof jobScraperConfigSchema>;

export const scanRequestSchema = z.object({
  config: jobScraperConfigSchema,
  scanId: z.string().min(1).optional(),
  scannedAt: z.iso.datetime({ offset: true }).optional(),
});

export type ScanRequest = z.infer<typeof scanRequestSchema>;

export interface ScannedJob {
  classification: (typeof JOB_CLASSIFICATIONS)[number];
  company: string;
  country: string;
  description: string;
  level: string;
  location: string;
  matchedSkills: string[];
  postedAt: string | null;
  postedDate: string | null;
  postedText: string | null;
  reviewReasons: string[];
  source: (typeof JOB_SOURCES)[number];
  sourceJobId: string;
  summary: string;
  title: string;
  url: string;
  workMode: (typeof JOB_WORK_MODES)[number] | "Unclear";
}

export interface ScanResult {
  documentCount: number;
  jobs: ScannedJob[];
  scanId: string;
  scannedAt: string;
  sourceIssues: JobSourceIssue[];
}

export interface ScanFailure {
  message: string;
  status: number;
}

// Preserve the AI service's readable error and HTTP status for the client.
export function mapScanFailure(status: number, body: unknown): ScanFailure {
  const message =
    body &&
    typeof body === "object" &&
    typeof (body as { error?: unknown }).error === "string"
      ? (body as { error: string }).error
      : null;

  return {
    message:
      message ?? `The job scan failed. The AI service returned ${status}.`,
    status: status >= 400 && status <= 599 ? status : 502,
  };
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

// Start with empty personal criteria; only boards and the date window have defaults.
export const DEFAULT_JOB_SCRAPER_CONFIG: JobScraperConfig = {
  roles: [],
  includedLevels: [],
  requiredTechnologies: [],
  excludedLevels: [],
  excludedTechnologies: [],
  sources: [...JOB_SOURCES],
  timeRange: "TODAY",
  customStartDate: null,
  customEndDate: null,
  worldwideWorkModes: [],
  philippinesWorkModes: [],
};

// These four criteria are required by both the API and AI scan boundaries.
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

export const jobClassificationSchema = z.enum(JOB_CLASSIFICATIONS);

export const jobIdSchema = z.string().min(1);

export const classificationUpdateSchema = z.object({
  classification: jobClassificationSchema,
});

export type ClassificationUpdate = z.infer<typeof classificationUpdateSchema>;

export interface SavedJob extends Omit<ScannedJob, "description"> {
  firstSeenAt: string;
  id: string;
  isManualClassification: boolean;
  isNew: boolean;
  lastSeenAt: string;
}

export interface JobSourceIssue {
  message: string;
  source: (typeof JOB_SOURCES)[number];
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

// Use the source's numeric job ID, falling back to the lowercase URL path.
export function getSourceJobId(
  url: string,
  source: (typeof JOB_SOURCES)[number],
): string {
  const pathname = new URL(url).pathname.replace(/\/$/, "");
  const numericId =
    source === "JobStreet"
      ? pathname.match(/\/job\/(\d+)/)?.[1]
      : pathname.match(/(?:\/|-)(\d+)$/)?.[1];

  return numericId ?? pathname.toLowerCase();
}
