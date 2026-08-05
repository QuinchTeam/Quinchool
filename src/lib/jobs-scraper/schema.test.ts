import assert from "node:assert/strict";
import test from "node:test";

import {
  containsExcludedTech,
  DEFAULT_JOB_SCRAPER_CONFIG,
  type DiscoveredJob,
  getJobRejectionReasons,
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

test("explains why a job fails the configured criteria", () => {
  assert.deepEqual(getJobRejectionReasons(baseJob, config, now), []);

  const rejections: [DiscoveredJob, RegExp][] = [
    [
      { ...baseJob, country: "Singapore", location: "Singapore" },
      /not an allowed location and work mode/,
    ],
    [
      { ...baseJob, summary: `${baseJob.summary} Requires Java.` },
      /excluded technology "Java"/,
    ],
    [{ ...baseJob, postedDate: "2026-08-01" }, /outside your .* window/],
    [
      { ...baseJob, level: "Senior", title: "Senior Full Stack Engineer" },
      /excluded level "Senior"/,
    ],
    [{ ...baseJob, title: "Data Analyst" }, /does not match a configured role/],
    [
      { ...baseJob, summary: "Ship features.", matchedSkills: [] },
      /required technologies were mentioned/,
    ],
    [
      { ...baseJob, url: "https://ph.jobstreet.com/job/456" },
      /not a LinkedIn job listing/,
    ],
  ];

  for (const [job, expected] of rejections) {
    const reasons = getJobRejectionReasons(job, config, now);

    assert.equal(
      reasons.some((reason) => expected.test(reason)),
      true,
      `expected ${expected} in ${JSON.stringify(reasons)}`,
    );
  }

  // A posting spanning several levels names "Senior" without being senior-only.
  assert.deepEqual(
    getJobRejectionReasons(
      {
        ...baseJob,
        level: "Junior",
        title: "Software Engineer (Junior / Mid / Senior)",
      },
      config,
      now,
    ),
    [],
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
});

test("treats missing details as open questions on potential jobs only", () => {
  const potentialJob: PotentialJob = {
    ...baseJob,
    matchedSkills: [],
    postedDate: null,
    postedAt: null,
    summary: "Ship product features with a modern stack.",
    reviewReasons: ["Posting date and required stack need review."],
    url: "https://www.linkedin.com/jobs/view/126",
    workMode: "Unclear",
  };

  assert.deepEqual(getJobRejectionReasons(potentialJob, config, now), []);
  assert.deepEqual(
    getJobRejectionReasons(
      { ...baseJob, postedDate: null } as unknown as DiscoveredJob,
      config,
      now,
    ),
    ["The posting date could not be established."],
  );
  assert.equal(
    getJobRejectionReasons(
      {
        ...potentialJob,
        level: "Senior",
        title: "Senior Software Engineer",
      },
      config,
      now,
    ).length > 0,
    true,
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

  assert.deepEqual(getJobRejectionReasons(recentJob, lastHourConfig, now), []);
  assert.deepEqual(
    getJobRejectionReasons(
      { ...recentJob, postedAt: "2026-08-02T12:30:00+08:00" },
      lastHourConfig,
      now,
    ),
    ["It was not posted within the last hour."],
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
    rejectedJobs: [
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
  assert.equal(result.rejectedJobs[0]?.reviewReasons[0]?.length, 500);
});
