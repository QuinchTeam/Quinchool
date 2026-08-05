import "server-only";

import {
  DEFAULT_JOB_SCRAPER_CONFIG,
  type DiscoveredJob,
  getSourceJobId,
  type JobScraperConfig,
  type JobScraperState,
  type JobSourceIssue,
  jobScraperConfigSchema,
  type PotentialJob,
  type SavedJob,
} from "@/lib/jobs-scraper/schema";
import { prisma } from "@/lib/prisma";

interface JobToSave {
  classification: SavedJob["classification"];
  description: string;
  job: DiscoveredJob | PotentialJob;
  reviewReasons: string[];
}

export async function getJobScraperConfig(
  userId: string,
): Promise<JobScraperConfig> {
  const config = await prisma.jobScraperConfig.upsert({
    where: { userId },
    create: { userId, ...toConfigData(DEFAULT_JOB_SCRAPER_CONFIG) },
    update: {},
  });

  return toJobScraperConfig(config);
}

export async function saveJobScraperConfig(
  userId: string,
  config: JobScraperConfig,
): Promise<JobScraperConfig> {
  const saved = await prisma.jobScraperConfig.upsert({
    where: { userId },
    create: { userId, ...toConfigData(config) },
    update: toConfigData(config),
  });

  return toJobScraperConfig(saved);
}

export async function getJobScraperState(
  userId: string,
  sourceIssues: JobSourceIssue[] = [],
): Promise<JobScraperState> {
  const config = await prisma.jobScraperConfig.upsert({
    where: { userId },
    create: { userId, ...toConfigData(DEFAULT_JOB_SCRAPER_CONFIG) },
    update: {},
  });
  const [jobs, counts, newJobCount] = await Promise.all([
    // ponytail: MATCH sorts before POTENTIAL before REJECTED, so the cap can
    // only ever truncate the rejected tail. Paginate if a user outgrows it.
    prisma.scrapedJob.findMany({
      where: { userId },
      orderBy: [
        { classification: "asc" },
        { lastSeenAt: "desc" },
        { firstSeenAt: "desc" },
      ],
      take: 300,
    }),
    prisma.scrapedJob.groupBy({
      by: ["classification"],
      where: { userId },
      _count: { _all: true },
    }),
    config.lastScanId
      ? prisma.scrapedJob.count({
          where: { userId, firstSeenScanId: config.lastScanId },
        })
      : Promise.resolve(0),
  ]);
  const classificationCounts = { MATCH: 0, POTENTIAL: 0, REJECTED: 0 };

  for (const { classification, _count } of counts) {
    if (classification in classificationCounts) {
      classificationCounts[classification as SavedJob["classification"]] =
        _count._all;
    }
  }

  return {
    classificationCounts,
    config: toJobScraperConfig(config),
    jobs: jobs.map((job) => toSavedJob(job, config.lastScanId)),
    lastScannedAt: config.lastScannedAt?.toISOString() ?? null,
    newJobCount,
    savedJobCount: Object.values(classificationCounts).reduce(
      (total, count) => total + count,
      0,
    ),
    sourceIssues,
  };
}

/**
 * Records the user's own verdict. The flag keeps later scans from overwriting
 * it, since the whole point of the review page is that the pipeline gets calls
 * wrong. Returns false when the job does not belong to the user.
 */
export async function updateJobClassification(
  userId: string,
  jobId: string,
  classification: SavedJob["classification"],
): Promise<boolean> {
  const { count } = await prisma.scrapedJob.updateMany({
    where: { id: jobId, userId },
    data: { classification, isManualClassification: true },
  });

  return count > 0;
}

export async function persistJobScan(
  userId: string,
  scanId: string,
  scannedAt: Date,
  jobs: JobToSave[],
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    for (const { classification, description, job, reviewReasons } of jobs) {
      const sourceJobId = getSourceJobId(job.url, job.source);
      const existing = await transaction.scrapedJob.findUnique({
        where: {
          userId_source_sourceJobId: {
            userId,
            source: job.source,
            sourceJobId,
          },
        },
        select: { isManualClassification: true },
      });
      const commonData = {
        url: job.url,
        title: job.title,
        company: job.company,
        location: job.location,
        country: job.country,
        workMode: job.workMode,
        level: job.level,
        postedDate: job.postedDate
          ? new Date(`${job.postedDate}T00:00:00Z`)
          : null,
        postedAt: job.postedAt ? new Date(job.postedAt) : null,
        postedText: job.postedText,
        summary: job.summary,
        description,
        matchedSkills: job.matchedSkills,
        reviewReasons,
        lastSeenAt: scannedAt,
        lastSeenScanId: scanId,
      };

      await transaction.scrapedJob.upsert({
        where: {
          userId_source_sourceJobId: {
            userId,
            source: job.source,
            sourceJobId,
          },
        },
        create: {
          userId,
          source: job.source,
          sourceJobId,
          classification,
          ...commonData,
          firstSeenAt: scannedAt,
          firstSeenScanId: scanId,
        },
        update: existing?.isManualClassification
          ? commonData
          : { ...commonData, classification },
      });
    }

    await transaction.jobScraperConfig.upsert({
      where: { userId },
      create: {
        userId,
        ...toConfigData(DEFAULT_JOB_SCRAPER_CONFIG),
        lastScannedAt: scannedAt,
        lastScanId: scanId,
      },
      update: { lastScannedAt: scannedAt, lastScanId: scanId },
    });
  });
}

function toConfigData(config: JobScraperConfig) {
  return {
    roles: config.roles,
    includedLevels: config.includedLevels,
    requiredTechnologies: config.requiredTechnologies,
    excludedLevels: config.excludedLevels,
    excludedTechnologies: config.excludedTechnologies,
    sources: config.sources,
    timeRange: config.timeRange,
    customStartDate: config.customStartDate
      ? new Date(`${config.customStartDate}T00:00:00Z`)
      : null,
    customEndDate: config.customEndDate
      ? new Date(`${config.customEndDate}T00:00:00Z`)
      : null,
    worldwideWorkModes: config.worldwideWorkModes,
    philippinesWorkModes: config.philippinesWorkModes,
  };
}

function toJobScraperConfig(config: {
  customEndDate: Date | null;
  customStartDate: Date | null;
  excludedLevels: string[];
  excludedTechnologies: string[];
  includedLevels: string[];
  philippinesWorkModes: string[];
  requiredTechnologies: string[];
  roles: string[];
  sources: string[];
  timeRange: string;
  worldwideWorkModes: string[];
}): JobScraperConfig {
  return jobScraperConfigSchema.parse({
    roles: config.roles,
    includedLevels: config.includedLevels,
    requiredTechnologies: config.requiredTechnologies,
    excludedLevels: config.excludedLevels,
    excludedTechnologies: config.excludedTechnologies,
    sources: config.sources,
    timeRange: config.timeRange,
    customStartDate: config.customStartDate?.toISOString().slice(0, 10) ?? null,
    customEndDate: config.customEndDate?.toISOString().slice(0, 10) ?? null,
    worldwideWorkModes: config.worldwideWorkModes,
    philippinesWorkModes: config.philippinesWorkModes,
  });
}

function toSavedJob(
  job: {
    classification: string;
    company: string;
    country: string;
    firstSeenAt: Date;
    id: string;
    isManualClassification: boolean;
    lastSeenAt: Date;
    level: string;
    location: string;
    matchedSkills: string[];
    postedAt: Date | null;
    postedDate: Date | null;
    postedText: string | null;
    reviewReasons: string[];
    source: string;
    summary: string;
    title: string;
    url: string;
    workMode: string;
    firstSeenScanId: string;
  },
  lastScanId: string | null,
): SavedJob {
  return {
    classification: job.classification as SavedJob["classification"],
    company: job.company,
    country: job.country,
    firstSeenAt: job.firstSeenAt.toISOString(),
    id: job.id,
    isManualClassification: job.isManualClassification,
    isNew: job.firstSeenScanId === lastScanId,
    lastSeenAt: job.lastSeenAt.toISOString(),
    level: job.level,
    location: job.location,
    matchedSkills: job.matchedSkills,
    postedAt: job.postedAt?.toISOString() ?? null,
    postedDate: job.postedDate?.toISOString().slice(0, 10) ?? null,
    postedText: job.postedText,
    reviewReasons: job.reviewReasons,
    source: job.source as SavedJob["source"],
    summary: job.summary,
    title: job.title,
    url: job.url,
    workMode: job.workMode as SavedJob["workMode"],
  };
}
