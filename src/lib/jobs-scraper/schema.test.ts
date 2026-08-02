import assert from "node:assert/strict";
import test from "node:test";

import {
  containsExcludedTech,
  type DiscoveredJob,
  filterDiscoveredJobs,
  filterPotentialJobs,
  type PotentialJob,
} from "./schema.ts";

const baseJob: DiscoveredJob = {
  title: "Mid-Level Full Stack Engineer",
  company: "Example",
  location: "Makati, Philippines",
  country: "Philippines",
  workMode: "Hybrid",
  source: "LinkedIn",
  url: "https://www.linkedin.com/jobs/view/123",
  postedDate: "2026-08-02",
  summary: "Build React and FastAPI products backed by PostgreSQL.",
  matchedSkills: ["React", "FastAPI", "PostgreSQL"],
};

test("keeps only same-day jobs that satisfy every search constraint", () => {
  const jobs = filterDiscoveredJobs(
    [
      baseJob,
      { ...baseJob, url: "https://www.linkedin.com/jobs/view/124" },
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
        url: "https://www.linkedin.com/jobs/view/yesterday",
      },
      {
        ...baseJob,
        title: "Senior Full Stack Engineer",
        url: "https://www.linkedin.com/jobs/view/125",
      },
      ...[
        "Lead Software Engineer",
        "Manager, Software Engineer",
        "CTO / Software Engineer",
      ].map((title, index) => ({
        ...baseJob,
        title,
        url: `https://www.linkedin.com/jobs/view/excluded-${index}`,
      })),
      {
        ...baseJob,
        url: "https://ph.linkedin.com/jobs/view/126",
      },
    ],
    "2026-08-02",
  );

  assert.deepEqual(
    jobs.map((job) => job.url),
    [baseJob.url, "https://www.linkedin.com/jobs/view/124"],
  );
  assert.equal(containsExcludedTech("JavaScript and TypeScript"), false);
  assert.equal(containsExcludedTech("Java and Spring"), true);

  const potentialJob: PotentialJob = {
    ...baseJob,
    matchedSkills: [],
    postedDate: null,
    reviewReasons: ["Posting date and required stack need review."],
    url: "https://www.linkedin.com/jobs/view/potential",
    workMode: "Unclear",
  };
  assert.deepEqual(
    filterPotentialJobs(
      [
        potentialJob,
        {
          ...potentialJob,
          postedDate: "2026-08-01",
          url: "https://www.linkedin.com/jobs/view/old-potential",
        },
        {
          ...potentialJob,
          title: "Senior Software Engineer",
          url: "https://www.linkedin.com/jobs/view/senior-potential",
        },
      ],
      "2026-08-02",
    ).map((job) => job.url),
    [potentialJob.url],
  );
});
