import assert from "node:assert/strict";
import test from "node:test";

import {
  containsExcludedTech,
  DEFAULT_JOB_SCRAPER_CONFIG,
  type DiscoveredJob,
  filterDiscoveredJobs,
  filterPotentialJobs,
  getSourceJobId,
  getTodayInManila,
  type JobScraperConfig,
  jobScraperConfigSchema,
  type PotentialJob,
  parseJobExtraction,
} from "./schema.ts";

const now = new Date("2026-08-02T14:00:00+08:00");
const config: JobScraperConfig = structuredClone(DEFAULT_JOB_SCRAPER_CONFIG);
const baseJob: DiscoveredJob = {
  title: "Mid-Level Full Stack Engineer",
  company: "Example",
  location: "Makati, Philippines",
  country: "Philippines",
  workMode: "Hybrid",
  level: "Mid",
  source: "LinkedIn",
  url: "https://www.linkedin.com/jobs/view/123",
  postedDate: "2026-08-02",
  postedAt: null,
  postedText: "2 hours ago",
  summary: "Build React and FastAPI products backed by PostgreSQL.",
  matchedSkills: ["React", "FastAPI", "PostgreSQL"],
};

test("applies user criteria to strict and potential jobs", () => {
  const jobs = filterDiscoveredJobs(
    [
      baseJob,
      {
        ...baseJob,
        country: "Singapore",
        location: "Singapore",
        url: "https://ph.jobstreet.com/job/456",
        source: "JobStreet",
      },
      {
        ...baseJob,
        summary: `${baseJob.summary} Requires Java.`,
        url: "https://ph.jobstreet.com/job/789",
        source: "JobStreet",
      },
      {
        ...baseJob,
        postedDate: "2026-08-01",
        url: "https://www.linkedin.com/jobs/view/124",
      },
      {
        ...baseJob,
        level: "Senior",
        title: "Senior Full Stack Engineer",
        url: "https://www.linkedin.com/jobs/view/125",
      },
    ],
    config,
    now,
  );

  assert.deepEqual(
    jobs.map((job) => job.url),
    [baseJob.url],
  );
  assert.equal(
    containsExcludedTech(
      "JavaScript and TypeScript",
      config.excludedTechnologies,
    ),
    false,
  );
  assert.equal(
    containsExcludedTech("Java and Spring", config.excludedTechnologies),
    true,
  );

  const potentialJob: PotentialJob = {
    ...baseJob,
    matchedSkills: [],
    postedDate: null,
    postedAt: null,
    reviewReasons: ["Posting date and required stack need review."],
    url: "https://www.linkedin.com/jobs/view/126",
    workMode: "Unclear",
  };
  assert.deepEqual(
    filterPotentialJobs(
      [
        potentialJob,
        {
          ...potentialJob,
          level: "Senior",
          title: "Senior Software Engineer",
          url: "https://www.linkedin.com/jobs/view/127",
        },
      ],
      config,
      now,
    ).map((job) => job.url),
    [potentialJob.url],
  );
});

test("supports last-hour and seven-day custom windows", () => {
  const lastHourConfig: JobScraperConfig = {
    ...config,
    timeRange: "LAST_HOUR",
  };
  const recentJob = {
    ...baseJob,
    postedAt: "2026-08-02T13:30:00+08:00",
  };

  assert.equal(
    filterDiscoveredJobs([recentJob], lastHourConfig, now).length,
    1,
  );
  assert.equal(
    filterDiscoveredJobs(
      [{ ...recentJob, postedAt: "2026-08-02T12:30:00+08:00" }],
      lastHourConfig,
      now,
    ).length,
    0,
  );

  const today = getTodayInManila();

  assert.equal(
    jobScraperConfigSchema.safeParse({
      ...config,
      timeRange: "CUSTOM",
      customStartDate: shiftDate(today, -6),
      customEndDate: today,
    }).success,
    true,
  );
  assert.equal(
    jobScraperConfigSchema.safeParse({
      ...config,
      timeRange: "CUSTOM",
      customStartDate: shiftDate(today, -7),
      customEndDate: today,
    }).success,
    false,
  );
});

function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

test("extracts stable source IDs for database deduplication", () => {
  assert.equal(
    getSourceJobId(
      "https://www.linkedin.com/jobs/view/full-stack-engineer-at-example-4321098765/",
      "LinkedIn",
    ),
    "4321098765",
  );
  assert.equal(
    getSourceJobId("https://ph.jobstreet.com/job/87654321", "JobStreet"),
    "87654321",
  );
});

test("normalizes verbose Gemini output without rejecting the scan", () => {
  const verboseReason = "Needs manual review. ".repeat(30);
  const result = parseJobExtraction({
    jobs: [],
    potentialJobs: [
      {
        ...baseJob,
        postedDate: null,
        reviewReasons: [verboseReason],
        workMode: "Unclear",
      },
    ],
  });

  assert.equal(result.potentialJobs.length, 1);
  assert.equal(result.potentialJobs[0]?.reviewReasons[0]?.length, 500);
});
