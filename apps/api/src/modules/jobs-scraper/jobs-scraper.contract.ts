/**
 * The wire contract for a scan, and the rules for reporting one that failed.
 *
 * Kept free of Nest decorators so it stays directly runnable under `node --test`
 * and importable from anywhere. The criteria themselves are a port of
 * `jobScraperConfigSchema` in apps/web/src/lib/jobs-scraper/schema.ts.
 */

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
const criteriaSchema = z.array(criterionSchema).max(30).transform(uniqueStrings);
const requiredCriteriaSchema = z
  .array(criterionSchema)
  .min(1)
  .max(30)
  .transform(uniqueStrings);

export const jobScraperConfigSchema = z
  .object({
    roles: requiredCriteriaSchema,
    includedLevels: requiredCriteriaSchema,
    requiredTechnologies: criteriaSchema,
    excludedLevels: criteriaSchema,
    excludedTechnologies: criteriaSchema,
    sources: z.array(z.enum(JOB_SOURCES)).min(1).transform(uniqueStrings),
    timeRange: z.enum(JOB_TIME_RANGES),
    customStartDate: z.iso.date().nullable(),
    customEndDate: z.iso.date().nullable(),
    worldwideWorkModes: z.array(z.enum(JOB_WORK_MODES)).transform(uniqueStrings),
    philippinesWorkModes: z
      .array(z.enum(JOB_WORK_MODES))
      .transform(uniqueStrings),
  })
  .superRefine((value, context) => {
    if (
      value.worldwideWorkModes.length === 0 &&
      value.philippinesWorkModes.length === 0
    ) {
      context.addIssue({
        code: "custom",
        message: "Select at least one location and work mode.",
        path: ["worldwideWorkModes"],
      });
    }

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

    // The web app also rejects a custom range outside the latest seven days.
    // That is a config-save rule, not a scan rule: enforcing it here would fail
    // a scan for a config that was valid when it was stored. Only the ordering
    // matters to build a window, and the AI service agrees on exactly this.
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

/** One graded listing, already flattened by the AI service into a storable row. */
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

/**
 * Turns an AI-service reply into the sentence the caller reads. The service
 * already phrases crawler and classification failures for a human — whether
 * the service is overloaded, quota is spent, or the crawler is down — so its
 * wording is passed through rather than replaced with a generic message.
 */
export function mapScanFailure(status: number, body: unknown): ScanFailure {
  const message =
    body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string"
      ? (body as { error: string }).error
      : null;

  return {
    message: message ?? `The job scan failed. The AI service returned ${status}.`,
    // The AI service already answers with a meaningful HTTP code; forward it
    // so a retryable failure still reads as one instead of collapsing to 500.
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

/**
 * What a first-time user starts with. Ported from DEFAULT_JOB_SCRAPER_CONFIG in
 * apps/web, which no longer owns the criteria now that the API stores them.
 */
export const DEFAULT_JOB_SCRAPER_CONFIG: JobScraperConfig = {
  roles: [
    "Software Developer",
    "Full Stack Developer",
    "Software Engineer",
    "Full Stack Engineer",
  ],
  includedLevels: ["Entry", "Junior", "Mid"],
  requiredTechnologies: [
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "Express",
    "NestJS",
    "FastAPI",
    "AI",
    "LLM",
    "PostgreSQL",
    "MySQL",
    "SQL",
  ],
  excludedLevels: [
    "Senior",
    "Sr",
    "Lead",
    "Manager",
    "Staff",
    "Principal",
    "Director",
    "Head",
    "CTO",
  ],
  excludedTechnologies: [
    "C#",
    ".NET",
    "dotnet",
    "Java",
    "OOP",
    "object-oriented programming",
    "NoSQL",
    "MongoDB",
    "DynamoDB",
    "Cassandra",
    "Firestore",
    "Cosmos DB",
    "Neo4j",
    "Redis",
  ],
  sources: [...JOB_SOURCES],
  timeRange: "TODAY",
  customStartDate: null,
  customEndDate: null,
  worldwideWorkModes: ["Remote"],
  philippinesWorkModes: ["Remote", "Hybrid"],
};

export const jobClassificationSchema = z.enum(JOB_CLASSIFICATIONS);

export const classificationUpdateSchema = z.object({
  classification: jobClassificationSchema,
  id: z.string().min(1),
});

export type ClassificationUpdate = z.infer<typeof classificationUpdateSchema>;

/** One stored listing as the review page reads it. */
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

/**
 * The stable per-source id a listing is deduplicated on. Both sites put a
 * numeric id in the path; the lowercased path is the fallback when they don't.
 */
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
