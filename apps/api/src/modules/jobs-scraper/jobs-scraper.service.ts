import { HttpException, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { domainLog } from "../../core/observability/logger";

import { streamAiService } from "../../shared/clients/ai/ai-client";
import { AiServiceError } from "../../shared/clients/ai/ai-client.errors";
import {
  type JobScraperConfig,
  type ScanRequest,
  type ScanResult,
} from "./jobs-scraper.contract";
import { JobsScraperRepository } from "./jobs-scraper.repository";

@Injectable()
export class JobsScraperService {
  constructor(private readonly repository: JobsScraperRepository) {}

  // Not awaited by the controller: the scan outlives the request, and its outcome lands in the
  // database so a refreshed page still sees it. Never rejects.
  async runInBackground(
    userId: string,
    config: JobScraperConfig,
  ): Promise<void> {
    try {
      const result = await this.scan(
        { config, scannedAt: new Date().toISOString() },
        (step, count) => this.repository.setScanStep(userId, step, count),
      );
      await this.repository.setScanStep(userId, "SAVING", result.jobs.length);
      await this.repository.persistScan(
        userId,
        result.scanId,
        new Date(result.scannedAt),
        result.jobs,
        result.sourceIssues ?? [],
      );
    } catch (error) {
      const message =
        error instanceof HttpException
          ? ((error.getResponse() as { message?: string }).message ??
            "The job scan failed.")
          : "The job scan failed.";

      await this.repository.failScan(userId, message).catch(() => {
        domainLog("error", "scan.status_write_failed", {
          domain: "jobs-scraper",
          errorType: error instanceof Error ? error.name : typeof error,
        });
      });
    }
  }

  // Generate scanId here so API and AI logs stay linked, even on failure.
  async scan(
    request: ScanRequest,
    onStep: (step: string, count: number | null) => Promise<void>,
  ): Promise<ScanResult> {
    const scanId = request.scanId ?? randomUUID();
    const startedAt = Date.now();

    domainLog("info", "scan.started", {
      domain: "jobs-scraper",
      scanId,
      roleCount: request.config.roles.length,
    });

    let result: ScanResult;

    try {
      result = await streamAiService<ScanResult>(
        "/jobs-scraper/scan",
        {
          config: request.config,
          scanId,
          scannedAt: request.scannedAt,
        },
        "The job scan failed.",
        onStep,
      );
    } catch (error) {
      const failure =
        error instanceof AiServiceError
          ? {
              code: `AI_${error.code.toUpperCase()}`,
              message: error.message,
              status: error.status,
            }
          : {
              code: "AI_SERVICE_UNREACHABLE",
              message:
                "The AI service is unreachable. Start the apps/ai FastAPI service.",
              status: 503,
            };

      domainLog("error", "scan.failed", {
        domain: "jobs-scraper",
        errorType: error instanceof Error ? error.name : typeof error,
        scanId,
      });

      throw new HttpException(
        {
          code: failure.code,
          message: failure.message,
          meta: { scanId },
        },
        failure.status,
      );
    }

    domainLog("info", "scan.completed", {
      domain: "jobs-scraper",
      documentCount: result.documentCount,
      durationMs: Date.now() - startedAt,
      jobCount: result.jobs?.length ?? 0,
      scanId,
      sourceIssueCount: result.sourceIssues?.length ?? 0,
    });

    return result;
  }
}
