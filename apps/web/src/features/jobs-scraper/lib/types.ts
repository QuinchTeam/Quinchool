import type {
  JOB_CLASSIFICATIONS,
  JOB_SOURCES,
  JOB_WORK_MODES,
} from "@/features/jobs-scraper/lib/constants";
import type { JobScraperConfig } from "@/features/jobs-scraper/validations/job-scraper-config";

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
  scan: {
    error: string | null;
    startedAt: string | null;
    status: "IDLE" | "RUNNING" | "FAILED";
    step: "SEARCHING" | "READING" | "ANALYZING" | "SAVING" | null;
    stepCount: number | null;
  };
  sourceIssues: JobSourceIssue[];
}

export interface JobSourceIssue {
  message: string;
  source: (typeof JOB_SOURCES)[number];
}
