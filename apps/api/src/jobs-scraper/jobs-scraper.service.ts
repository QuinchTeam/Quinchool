import { HttpException, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { env } from "../config/env";
import {
  mapScanFailure,
  type ScanRequest,
  type ScanResult,
} from "./scan-contract";

// A scan crawls two sources and then waits on Gemini, which is why the Next.js
// route reserved 300s for it. Keep the ceiling here so the AI service, not this
// client, is the one that decides a scan has gone on too long.
const SCAN_TIMEOUT_MS = 300_000;

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

    let response: Response;

    try {
      response = await fetch(`${env.AI_SERVICE_URL}/jobs-scraper/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(SCAN_TIMEOUT_MS),
        body: JSON.stringify({
          config: request.config,
          scanId,
          scannedAt: request.scannedAt,
        }),
      });
    } catch (error) {
      this.logger.error(
        `scan.unreachable ${JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          scanId,
        })}`,
      );

      throw new HttpException(
        {
          error:
            "The AI service is unreachable. Start the apps/ai FastAPI service.",
          scanId,
        },
        503,
      );
    }

    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const failure = mapScanFailure(response.status, body);

      this.logger.error(
        `scan.failed ${JSON.stringify({
          aiStatus: response.status,
          error: failure.message,
          scanId,
        })}`,
      );

      throw new HttpException(
        { error: failure.message, scanId },
        failure.status,
      );
    }

    const result = body as ScanResult;

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
