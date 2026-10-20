import { HttpException, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { domainLog } from "../../core/observability/logger";

import { callAiService } from "../../shared/clients/ai/ai-client";
import { AiServiceError } from "../../shared/clients/ai/ai-client.errors";
import { type ScanRequest, type ScanResult } from "./jobs-scraper.contract";

@Injectable()
export class JobsScraperService {
  // Generate scanId here so API and AI logs stay linked, even on failure.
  async scan(request: ScanRequest): Promise<ScanResult> {
    const scanId = request.scanId ?? randomUUID();
    const startedAt = Date.now();

    domainLog("info", "scan.started", {
      domain: "jobs-scraper",
      scanId,
      roleCount: request.config.roles.length,
    });

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
