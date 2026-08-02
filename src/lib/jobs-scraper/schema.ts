import { z } from "zod";

export const JOB_ROLES = [
  "Software Developer",
  "Full Stack Developer",
  "Software Engineer",
  "Full Stack Engineer",
] as const;

export const REQUIRED_TECH = [
  "React / React frameworks",
  "TypeScript / Node.js",
  "Express / NestJS / FastAPI",
  "AI integration",
  "PostgreSQL / MySQL / SQL",
] as const;

export const EXCLUDED_TECH = ["C# / .NET", "Java", "OOP", "NoSQL"] as const;

export const JOB_LEVELS = ["Entry", "Junior", "Mid"] as const;

export const EXCLUDED_JOB_LEVELS = [
  "Senior",
  "Lead",
  "Manager",
  "Staff / Principal",
  "Director / Head",
  "CTO",
] as const;

export const JOB_SOURCES = ["LinkedIn", "JobStreet"] as const;

export const JOB_URL_PREFIXES = {
  LinkedIn: "https://www.linkedin.com/jobs/view/",
  JobStreet: "https://ph.jobstreet.com/job/",
} as const;

export const jobSourceSchema = z.enum(JOB_SOURCES);
const workModeSchema = z.enum(["Remote", "Hybrid"]);

export const discoveredJobSchema = z.object({
  title: z.string().min(1).max(160),
  company: z.string().min(1).max(160),
  location: z.string().min(1).max(160),
  country: z.string().min(1).max(80),
  workMode: workModeSchema,
  source: jobSourceSchema,
  url: z.url(),
  postedDate: z.iso.date(),
  summary: z.string().min(1).max(500),
  matchedSkills: z.array(z.string().min(1).max(60)).max(8),
});

export const discoveredJobsSchema = z.object({
  jobs: z.array(discoveredJobSchema).max(30),
});

export type DiscoveredJob = z.infer<typeof discoveredJobSchema>;

export const potentialJobSchema = discoveredJobSchema
  .omit({ postedDate: true, workMode: true })
  .extend({
    postedDate: z.iso.date().nullable(),
    reviewReasons: z.array(z.string().min(1).max(160)).min(1).max(4),
    workMode: z.enum(["Remote", "Hybrid", "Unclear"]),
  });

export const jobExtractionSchema = discoveredJobsSchema.extend({
  potentialJobs: z.array(potentialJobSchema).max(30),
});

export type PotentialJob = z.infer<typeof potentialJobSchema>;

export interface JobScanResult {
  jobs: DiscoveredJob[];
  potentialJobs: PotentialJob[];
  scanDate: string;
  scannedAt: string;
  sourceIssues: JobSourceIssue[];
}

export interface JobSourceIssue {
  message: string;
  source: DiscoveredJob["source"];
}

const TARGET_TITLE_PATTERNS = [
  /\bsoftware\s+(developer|engineer)\b/i,
  /\bfull[-\s]?stack\s+(developer|engineer)\b/i,
];

const EXCLUDED_SENIORITY_PATTERNS = [
  /\bsenior\b/i,
  /\bsr\.?\b/i,
  /\blead\b/i,
  /\bmanager\b/i,
  /\bstaff\b/i,
  /\bprincipal\b/i,
  /\bdirector\b/i,
  /\bhead\b/i,
  /\bcto\b/i,
  /\bchief technology officer\b/i,
];

const REQUIRED_TECH_PATTERNS = [
  /\breact\b/i,
  /\bnext\.?js\b/i,
  /\bremix\b/i,
  /\bgatsby\b/i,
  /\btypescript\b/i,
  /\bnode\.?js\b/i,
  /\bexpress\.?js\b/i,
  /\bnest\.?js\b/i,
  /\bfastify\b/i,
  /\bfastapi\b/i,
  /\bartificial intelligence\b/i,
  /\bai integration\b/i,
  /\bllm\b/i,
  /\bpostgres(ql)?\b/i,
  /\bmysql\b/i,
  /\bsql\b/i,
];

const EXCLUDED_TECH_PATTERNS = [
  /(?:^|\W)c#(?:\W|$)/i,
  /\.net\b/i,
  /\bdotnet\b/i,
  /\bjava\b/i,
  /\boop\b/i,
  /\bobject[-\s]oriented\b/i,
  /\bnosql\b/i,
  /\bmongo(db)?\b/i,
  /\bdynamodb\b/i,
  /\bcassandra\b/i,
  /\bfirestore\b/i,
  /\bcosmos\s*db\b/i,
  /\bneo4j\b/i,
  /\bredis\b/i,
];

export function filterDiscoveredJobs(
  jobs: DiscoveredJob[],
  scanDate: string,
): DiscoveredJob[] {
  const seen = new Set<string>();

  return jobs.filter((job) => {
    const source = getJobSourceFromUrl(job.url);
    const searchableText = [job.title, job.summary, ...job.matchedSkills].join(
      " ",
    );
    const isAllowedLocation =
      job.workMode === "Remote" || isPhilippines(job.country);
    const isMatch =
      source === job.source &&
      job.url.startsWith(JOB_URL_PREFIXES[job.source]) &&
      job.postedDate === scanDate &&
      isAllowedLocation &&
      TARGET_TITLE_PATTERNS.some((pattern) => pattern.test(job.title)) &&
      !EXCLUDED_SENIORITY_PATTERNS.some((pattern) => pattern.test(job.title)) &&
      REQUIRED_TECH_PATTERNS.some((pattern) => pattern.test(searchableText)) &&
      !containsExcludedTech(searchableText);
    const dedupeKey = job.url.toLowerCase();

    if (!isMatch || seen.has(dedupeKey)) {
      return false;
    }

    seen.add(dedupeKey);
    return true;
  });
}

export function filterPotentialJobs(
  jobs: PotentialJob[],
  scanDate: string,
): PotentialJob[] {
  const seen = new Set<string>();

  return jobs.filter((job) => {
    const source = getJobSourceFromUrl(job.url);
    const searchableText = [job.title, job.summary, ...job.matchedSkills].join(
      " ",
    );
    const isAllowedLocation =
      job.workMode !== "Hybrid" || isPhilippines(job.country);
    const isMatch =
      source === job.source &&
      job.url.startsWith(JOB_URL_PREFIXES[job.source]) &&
      (job.postedDate === null || job.postedDate === scanDate) &&
      isAllowedLocation &&
      TARGET_TITLE_PATTERNS.some((pattern) => pattern.test(job.title)) &&
      !EXCLUDED_SENIORITY_PATTERNS.some((pattern) => pattern.test(job.title)) &&
      !containsExcludedTech(searchableText);
    const dedupeKey = job.url.toLowerCase();

    if (!isMatch || seen.has(dedupeKey)) {
      return false;
    }

    seen.add(dedupeKey);
    return true;
  });
}

export function containsExcludedTech(text: string): boolean {
  return EXCLUDED_TECH_PATTERNS.some((pattern) => pattern.test(text));
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

function isPhilippines(country: string): boolean {
  return /^(philippines|ph)$/i.test(country.trim());
}
