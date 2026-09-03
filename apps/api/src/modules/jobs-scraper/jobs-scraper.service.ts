import { HttpException, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { callAiService } from "../../shared/clients/ai/ai-client";
import { AiServiceError } from "../../shared/clients/ai/ai-client.errors";
import {
  type ScanRequest,
  type ScanResult,
} from "./jobs-scraper.contract";

@Injectable()
export class JobsScraperService {
  private readonly logger = new Logger(JobsScraperService.name);

  /**
   * Runs one scan against the AI service. This owns the scan id so every log
   * line on both sides of the call can be tied together, and so the caller gets
   * one back even when the scan fails.
   */
  async scan(request: ScanRequest): Promise<ScanResult> {
    const scanId = request.scanId ?? randomUUID();
    const startedAt = Date.now();

    this.logger.log(
      `scan.started ${JSON.stringify({
        roles: request.config.roles,
        scanId,
        sources: request.config.sources,
        timeRange: request.config.timeRange,
      })}`,
    );

    let result: ScanResult;

    try {
      result = await callAiService<ScanResult>(
        "/jobs-scraper/scan",
        {
          config: request.config,
          scanId,
          scannedAt: request.scannedAt,
        },
        "The job scan failed.",
      );
    } catch (error) {
      const failure =
        error instanceof AiServiceError
          ? { message: error.message, status: error.status }
          : {
              message:
                "The AI service is unreachable. Start the apps/ai FastAPI service.",
              status: 503,
            };

      this.logger.error(
        `scan.failed ${JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          scanId,
        })}`,
      );

      throw new HttpException(
        { error: failure.message, scanId },
        failure.status,
      );
    }

    this.logger.log(
      `scan.completed ${JSON.stringify({
        documentCount: result.documentCount,
        durationMs: Date.now() - startedAt,
        jobCount: result.jobs?.length ?? 0,
        scanId,
        sourceIssues: result.sourceIssues,
      })}`,
    );

    return result;
  }
}
