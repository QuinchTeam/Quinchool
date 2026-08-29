/**
 * Every database read and write the jobs scraper does. Ported from
 * apps/web/src/lib/jobs-scraper/storage.ts when the API took ownership of the
 * feature; the web app is a frontend for it now.
 */

import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import {
  DEFAULT_JOB_SCRAPER_CONFIG,
  getSourceJobId,
  type JobScraperConfig,
  jobScraperConfigSchema,
  type JobScraperState,
  type JobSourceIssue,
  type SavedJob,
  type ScannedJob,
} from "./scan-contract";

@Injectable()
export class JobsScraperStorage {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(userId: string): Promise<JobScraperConfig> {
    return toJobScraperConfig(await this.upsertConfigRow(userId));
  }

  async saveConfig(
    userId: string,
    config: JobScraperConfig,
  ): Promise<JobScraperConfig> {
    const saved = await this.prisma.jobScraperConfig.upsert({
      where: { userId },
      create: { userId, ...toConfigData(config) },
      update: toConfigData(config),
    });

    return toJobScraperConfig(saved);
  }

  async getState(
    userId: string,
    sourceIssues: JobSourceIssue[] = [],
  ): Promise<JobScraperState> {
    const config = await this.upsertConfigRow(userId);
    const [jobs, counts, newJobCount] = await Promise.all([
      // ponytail: MATCH sorts before POTENTIAL before REJECTED, so the cap can
      // only ever truncate the rejected tail. Paginate if a user outgrows it.
      this.prisma.scrapedJob.findMany({
        where: { userId },
        orderBy: [
          { classification: "asc" },
          { lastSeenAt: "desc" },
          { firstSeenAt: "desc" },
        ],
        take: 300,
      }),
      this.prisma.scrapedJob.groupBy({
        by: ["classification"],
        where: { userId },
        _count: { _all: true },
      }),
      config.lastScanId
        ? this.prisma.scrapedJob.count({
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
   * Records the reviewer's own verdict. The flag keeps later scans from
   * overwriting it, since the whole point of the review page is that the
   * pipeline gets calls wrong. Returns false when the job belongs to someone
   * else.
   */
  async updateClassification(
    userId: string,
    jobId: string,
    classification: SavedJob["classification"],
  ): Promise<boolean> {
    const { count } = await this.prisma.scrapedJob.updateMany({
      where: { id: jobId, userId },
      data: { classification, isManualClassification: true },
    });

    return count > 0;
  }

  async persistScan(
    userId: string,
    scanId: string,
    scannedAt: Date,
    jobs: ScannedJob[],
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      for (const job of jobs) {
        const sourceJobId = getSourceJobId(job.url, job.source);
        const existing = await transaction.scrapedJob.findUnique({
          where: {
            userId_source_sourceJobId: { userId, source: job.source, sourceJobId },
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
          description: job.description,
          matchedSkills: job.matchedSkills,
          reviewReasons: job.reviewReasons,
          lastSeenAt: scannedAt,
          lastSeenScanId: scanId,
        };

        await transaction.scrapedJob.upsert({
          where: {
            userId_source_sourceJobId: { userId, source: job.source, sourceJobId },
          },
          create: {
            userId,
            source: job.source,
            sourceJobId,
            classification: job.classification,
            ...commonData,
            firstSeenAt: scannedAt,
            firstSeenScanId: scanId,
          },
          update: existing?.isManualClassification
            ? commonData
            : { ...commonData, classification: job.classification },
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

  /** Reading the config creates it, so a new user has one without a write path. */
  private upsertConfigRow(userId: string) {
    return this.prisma.jobScraperConfig.upsert({
      where: { userId },
      create: { userId, ...toConfigData(DEFAULT_JOB_SCRAPER_CONFIG) },
      update: {},
    });
  }
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
    firstSeenScanId: string;
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
    sourceJobId: string;
    summary: string;
    title: string;
    url: string;
    workMode: string;
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
    sourceJobId: job.sourceJobId,
    summary: job.summary,
    title: job.title,
    url: job.url,
    workMode: job.workMode as SavedJob["workMode"],
  };
}
