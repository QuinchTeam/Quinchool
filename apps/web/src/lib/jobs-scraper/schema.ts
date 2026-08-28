import { z } from "zod";

export const JOB_ROLES = [
  "Software Developer",
  "Full Stack Developer",
  "Software Engineer",
  "Full Stack Engineer",
] as const;

export const REQUIRED_TECH = [
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
] as const;

export const EXCLUDED_TECH = [
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
] as const;

export const JOB_LEVELS = ["Entry", "Junior", "Mid"] as const;

export const EXCLUDED_JOB_LEVELS = [
  "Senior",
  "Sr",
  "Lead",
  "Manager",
  "Staff",
  "Principal",
  "Director",
  "Head",
  "CTO",
] as const;

export const JOB_SOURCES = ["LinkedIn", "JobStreet"] as const;
export const JOB_WORK_MODES = ["Remote", "Hybrid", "Onsite"] as const;
export const JOB_TIME_RANGES = [
  "LAST_HOUR",
  "TODAY",
  "THIS_WEEK",
  "CUSTOM",
] as const;

export const JOB_URL_PREFIXES = {
  LinkedIn: "https://www.linkedin.com/jobs/view/",
  JobStreet: "https://ph.jobstreet.com/job/",
} as const;

const criterionSchema = z.string().trim().min(1).max(80);
const criteriaSchema = z
  .array(criterionSchema)
  .max(30)
  .transform(uniqueStrings);
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
    worldwideWorkModes: z
      .array(z.enum(JOB_WORK_MODES))
      .transform(uniqueStrings),
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

export const DEFAULT_JOB_SCRAPER_CONFIG: JobScraperConfig = {
  roles: [...JOB_ROLES],
  includedLevels: [...JOB_LEVELS],
  requiredTechnologies: [...REQUIRED_TECH],
  excludedLevels: [...EXCLUDED_JOB_LEVELS],
  excludedTechnologies: [...EXCLUDED_TECH],
  sources: [...JOB_SOURCES],
  timeRange: "TODAY",
  customStartDate: null,
  customEndDate: null,
  worldwideWorkModes: ["Remote"],
  philippinesWorkModes: ["Remote", "Hybrid"],
};

export const jobSourceSchema = z.enum(JOB_SOURCES);
const workModeSchema = z.enum(JOB_WORK_MODES);

export const discoveredJobSchema = z.object({
  title: z.string().trim().min(1),
  company: z.string().trim().min(1),
  location: z.string().trim().min(1),
  country: z.string().trim().min(1),
  workMode: workModeSchema,
  level: z.string().trim().min(1),
  source: jobSourceSchema,
  url: z.url(),
  postedDate: z.iso.date(),
  postedAt: z.iso.datetime({ offset: true }).nullable(),
  postedText: z.string().trim().min(1).nullable(),
  summary: z.string().trim().min(1),
  matchedSkills: z.array(z.string().trim().min(1)),
});

export const discoveredJobsSchema = z.object({
  jobs: z.array(discoveredJobSchema),
});

export type DiscoveredJob = z.infer<typeof discoveredJobSchema>;

export const potentialJobSchema = discoveredJobSchema
  .omit({ postedDate: true, workMode: true })
  .extend({
    postedDate: z.iso.date().nullable(),
    reviewReasons: z.array(z.string().trim().min(1)).min(1),
    workMode: z.enum([...JOB_WORK_MODES, "Unclear"]),
  });

export const jobExtractionSchema = discoveredJobsSchema.extend({
  potentialJobs: z.array(potentialJobSchema),
  rejectedJobs: z.array(potentialJobSchema),
});

export type PotentialJob = z.infer<typeof potentialJobSchema>;

export function parseJobExtraction(value: unknown): {
  jobs: DiscoveredJob[];
  potentialJobs: PotentialJob[];
  rejectedJobs: PotentialJob[];
} {
  const parsed = jobExtractionSchema.parse(value);

  return {
    jobs: parsed.jobs.slice(0, 30).map(normalizeGeneratedJob),
    potentialJobs: parsed.potentialJobs.slice(0, 30).map(normalizeReviewedJob),
    rejectedJobs: parsed.rejectedJobs.slice(0, 30).map(normalizeReviewedJob),
  };
}

export const JOB_CLASSIFICATIONS = ["MATCH", "POTENTIAL", "REJECTED"] as const;

export const jobClassificationSchema = z.enum(JOB_CLASSIFICATIONS);

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
  source: DiscoveredJob["source"];
}

/**
 * Every reason the configured criteria disqualify a job. An empty array means
 * the job passed. Jobs carrying `reviewReasons` are graded leniently: a missing
 * posting date, an unclear work mode, and a missing required technology are
 * treated as open questions instead of failures, because they are exactly what
 * puts a listing in the potential bucket.
 */
export function getJobRejectionReasons(
  job: DiscoveredJob | PotentialJob,
  config: JobScraperConfig,
  now = new Date(),
): string[] {
  const isLenient = "reviewReasons" in job;
  const searchableText = [job.title, job.summary, ...job.matchedSkills].join(
    " ",
  );
  const levelText = `${job.title} ${job.level}`;
  const excludedLevel = findMatchingCriterion(levelText, config.excludedLevels);
  const excludedTech = findMatchingCriterion(
    searchableText,
    config.excludedTechnologies,
  );
  const reasons: string[] = [];

  if (
    getJobSourceFromUrl(job.url) !== job.source ||
    !job.url.startsWith(JOB_URL_PREFIXES[job.source])
  ) {
    reasons.push(`The URL is not a ${job.source} job listing.`);
  }

  if (!config.sources.includes(job.source)) {
    reasons.push(`${job.source} is not one of your enabled sources.`);
  }

  if (job.postedDate === null) {
    if (!isLenient) {
      reasons.push("The posting date could not be established.");
    }
  } else if (!isDateInRange(job.postedDate, job.postedAt, config, now)) {
    const { fromDate, toDate } = getJobDateWindow(config, now);
    reasons.push(
      config.timeRange === "LAST_HOUR"
        ? "It was not posted within the last hour."
        : `Posted ${job.postedDate}, outside your ${fromDate} to ${toDate} window.`,
    );
  }

  if (job.workMode === "Unclear") {
    if (!isLenient) {
      reasons.push("The work mode could not be established.");
    }
  } else if (!isLocationAllowed(job.country, job.workMode, config)) {
    reasons.push(
      `${job.workMode} work in ${job.country} is not an allowed location and work mode.`,
    );
  }

  if (!matchesAnyCriterion(job.title, config.roles)) {
    reasons.push(`"${job.title}" does not match a configured role.`);
  }

  if (!matchesAnyCriterion(job.level, config.includedLevels)) {
    reasons.push(`Level "${job.level}" is not an included level.`);
  }

  // A posting open to several levels ("Software Engineer (Junior / Mid /
  // Senior)") names an excluded level without being one. An included level in
  // the same text settles it, so only reject when no included level appears.
  if (excludedLevel && !matchesAnyCriterion(levelText, config.includedLevels)) {
    reasons.push(
      `The title or level matches the excluded level "${excludedLevel}".`,
    );
  }

  if (
    !isLenient &&
    config.requiredTechnologies.length > 0 &&
    !matchesAnyCriterion(searchableText, config.requiredTechnologies)
  ) {
    reasons.push("None of your required technologies were mentioned.");
  }

  if (excludedTech) {
    reasons.push(`It mentions the excluded technology "${excludedTech}".`);
  }

  return reasons;
}

export function findMatchingCriterion(
  text: string,
  criteria: readonly string[],
): string | null {
  return (
    criteria.find((criterion) => textMatchesCriterion(text, criterion)) ?? null
  );
}

export function containsExcludedTech(
  text: string,
  excludedTechnologies: readonly string[],
): boolean {
  return findMatchingCriterion(text, excludedTechnologies) !== null;
}

export function matchesAnyCriterion(
  text: string,
  criteria: readonly string[],
): boolean {
  return criteria.some((criterion) => textMatchesCriterion(text, criterion));
}

export function textMatchesCriterion(text: string, criterion: string): boolean {
  const trimmed = criterion.trim();

  if (!trimmed) {
    return false;
  }

  const escaped = trimmed
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  const startsWithWord = /[A-Za-z0-9_]/.test(trimmed[0] ?? "");
  const endsWithWord = /[A-Za-z0-9_]/.test(trimmed.at(-1) ?? "");
  const pattern = `${startsWithWord ? "\\b" : ""}${escaped}${endsWithWord ? "\\b" : ""}`;

  return new RegExp(pattern, "i").test(text);
}

export function isLocationAllowed(
  country: string,
  workMode: (typeof JOB_WORK_MODES)[number],
  config: JobScraperConfig,
): boolean {
  return (
    config.worldwideWorkModes.includes(workMode) ||
    (isPhilippines(country) && config.philippinesWorkModes.includes(workMode))
  );
}

export function isDateInRange(
  postedDate: string,
  postedAt: string | null,
  config: JobScraperConfig,
  now = new Date(),
): boolean {
  if (config.timeRange === "LAST_HOUR") {
    if (!postedAt) {
      return false;
    }

    const timestamp = Date.parse(postedAt);
    return timestamp >= now.getTime() - 3_600_000 && timestamp <= now.getTime();
  }

  const { fromDate, toDate } = getJobDateWindow(config, now);
  return postedDate >= fromDate && postedDate <= toDate;
}

export function getJobDateWindow(
  config: JobScraperConfig,
  now = new Date(),
): { fromDate: string; toDate: string } {
  const today = getTodayInManila(now);

  if (
    config.timeRange === "CUSTOM" &&
    config.customStartDate &&
    config.customEndDate
  ) {
    return {
      fromDate: config.customStartDate,
      toDate: config.customEndDate,
    };
  }

  return {
    fromDate: config.timeRange === "THIS_WEEK" ? shiftDate(today, -6) : today,
    toDate: today,
  };
}

export function getCrawlLookbackSeconds(config: JobScraperConfig): number {
  if (config.timeRange === "LAST_HOUR") {
    return 3_600;
  }

  if (config.timeRange === "TODAY") {
    return 86_400;
  }

  return 604_800;
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

export function getJobSourceFromUrl(
  url: string,
): DiscoveredJob["source"] | null {
  const hostname = new URL(url).hostname.toLowerCase();

  if (hostname === "linkedin.com" || hostname.endsWith(".linkedin.com")) {
    return "LinkedIn";
  }

  if (hostname === "jobstreet.com" || hostname.endsWith(".jobstreet.com")) {
    return "JobStreet";
  }

  return null;
}

export function getSourceJobId(
  url: string,
  source: DiscoveredJob["source"],
): string {
  const pathname = new URL(url).pathname.replace(/\/$/, "");
  const numericId =
    source === "JobStreet"
      ? pathname.match(/\/job\/(\d+)/)?.[1]
      : pathname.match(/(?:\/|-)(\d+)$/)?.[1];

  return numericId ?? pathname.toLowerCase();
}

function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function isPhilippines(country: string): boolean {
  return /^(philippines|ph)$/i.test(country.trim());
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

function normalizeGeneratedJob<T extends DiscoveredJob | PotentialJob>(
  job: T,
): T {
  return {
    ...job,
    title: truncate(job.title, 300),
    company: truncate(job.company, 300),
    location: truncate(job.location, 300),
    country: truncate(job.country, 120),
    level: truncate(job.level, 120),
    postedText: job.postedText ? truncate(job.postedText, 240) : null,
    summary: truncate(job.summary, 1_000),
    matchedSkills: job.matchedSkills
      .slice(0, 12)
      .map((skill) => truncate(skill, 120)),
  };
}

function normalizeReviewedJob(job: PotentialJob): PotentialJob {
  return {
    ...normalizeGeneratedJob(job),
    reviewReasons: job.reviewReasons
      .slice(0, 4)
      .map((reason) => truncate(reason, 500)),
  };
}

function truncate(value: string, maxLength: number): string {
  return value.slice(0, maxLength);
}
