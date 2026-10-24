import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../core/database/prisma/prisma.service";
import type { Prisma } from "../../generated/prisma/client";
import {
  DEFAULT_JOB_SCRAPER_CONFIG,
  getSourceJobId,
  type JobScraperConfig,
  jobScraperConfigSchema,
  type JobScraperState,
  type JobSourceIssue,
  type SavedJob,
  type ScannedJob,
  type ScanStatus,
} from "./jobs-scraper.contract";

const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;
// Longer than the 5-minute AI call, so only a scan killed mid-run (e.g. by a deploy) times out.
const SCAN_TIMEOUT_MS = 10 * 60 * 1000;

function toScanStatus(config: {
  scanError: string | null;
  scanStartedAt: Date | null;
  scanStatus: string | null;
  scanStep: string | null;
  scanStepCount: number | null;
}): ScanStatus {
  const startedAt = config.scanStartedAt?.toISOString() ?? null;
  const progress = {
    step: (config.scanStep as ScanStatus["step"]) ?? null,
    stepCount: config.scanStepCount,
  };

  if (config.scanStatus === "RUNNING") {
    const timedOut =
      !config.scanStartedAt ||
      Date.now() - config.scanStartedAt.getTime() > SCAN_TIMEOUT_MS;

    return timedOut
      ? {
          status: "FAILED",
          error: "The scan was interrupted. Try again.",
          startedAt,
          ...progress,
        }
      : { status: "RUNNING", error: null, startedAt, ...progress };
  }

  return config.scanStatus === "FAILED"
    ? { status: "FAILED", error: config.scanError, startedAt, ...progress }
    : { status: "IDLE", error: null, startedAt, step: null, stepCount: null };
}

@Injectable()
export class JobsScraperRepository {
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

  async getState(userId: string): Promise<JobScraperState> {
    const config = await this.upsertConfigRow(userId);
    // Listings no scan has seen recently are most likely filled or taken down.
    const fresh = {
      userId,
      lastSeenAt: { gte: new Date(Date.now() - STALE_AFTER_MS) },
    };
    const [jobs, counts, newJobCount] = await Promise.all([
      // shortcut: the cap drops rejected jobs first; paginate when users outgrow it.
      this.prisma.scrapedJob.findMany({
        where: fresh,
        orderBy: [
          { classification: "asc" },
          { lastSeenAt: "desc" },
          { firstSeenAt: "desc" },
        ],
        take: 300,
      }),
      this.prisma.scrapedJob.groupBy({
        by: ["classification"],
        where: fresh,
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
      scan: toScanStatus(config),
      sourceIssues: config.scanSourceIssues as unknown as JobSourceIssue[],
    };
  }

  // Claims the scan slot atomically; false means a fresh scan is already running.
  async startScan(userId: string): Promise<boolean> {
    const { count } = await this.prisma.jobScraperConfig.updateMany({
      where: {
        userId,
        OR: [
          { scanStatus: { not: "RUNNING" } },
          { scanStatus: null },
          { scanStartedAt: { lt: new Date(Date.now() - SCAN_TIMEOUT_MS) } },
        ],
      },
      data: {
        scanStatus: "RUNNING",
        scanStartedAt: new Date(),
        scanError: null,
        scanStep: null,
        scanStepCount: null,
      },
    });

    return count > 0;
  }

  async setScanStep(
    userId: string,
    step: string,
    count: number | null,
  ): Promise<void> {
    await this.prisma.jobScraperConfig.update({
      where: { userId },
      data: { scanStep: step, scanStepCount: count },
    });
  }

  async failScan(userId: string, message: string): Promise<void> {
    await this.prisma.jobScraperConfig.update({
      where: { userId },
      data: { scanStatus: "FAILED", scanError: message },
    });
  }

  // Keep manual classifications from being overwritten by future scans.
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
    sourceIssues: JobSourceIssue[],
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      for (const job of jobs) {
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
          // undefined keeps an earlier exact time once the label coarsens to "1d ago".
          postedAt: job.postedAt ? new Date(job.postedAt) : undefined,
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

      const scanData = {
        lastScannedAt: scannedAt,
        lastScanId: scanId,
        scanStatus: null,
        scanError: null,
        scanStep: null,
        scanStepCount: null,
        scanSourceIssues: sourceIssues as unknown as Prisma.InputJsonValue,
      };

      await transaction.jobScraperConfig.upsert({
        where: { userId },
        create: {
          userId,
          ...toConfigData(DEFAULT_JOB_SCRAPER_CONFIG),
          ...scanData,
        },
        update: scanData,
      });
    });
  }

  // Upsert on read so a new account has a config before its first save.
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
