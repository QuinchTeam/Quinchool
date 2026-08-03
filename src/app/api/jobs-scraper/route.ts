import { randomUUID } from "node:crypto";
import { ApiError as GoogleApiError } from "@google/genai";

import { Crawl4AiUnavailableError } from "@/lib/jobs-scraper/crawler";
import { logJobsScraper } from "@/lib/jobs-scraper/logging";
import { jobScraperConfigSchema } from "@/lib/jobs-scraper/schema";
import { scanJobs } from "@/lib/jobs-scraper/service";
import {
  getJobScraperState,
  saveJobScraperConfig,
} from "@/lib/jobs-scraper/storage";
import { getSessionUserId } from "@/lib/session";

export const maxDuration = 300;

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json(await getJobScraperState(userId));
}

export async function PUT(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = jobScraperConfigSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid configuration" },
      { status: 400 },
    );
  }

  await saveJobScraperConfig(userId, parsed.data);
  return Response.json(await getJobScraperState(userId));
}

export async function POST() {
  const userId = await getSessionUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scanId = randomUUID();
  const headers = { "X-Jobs-Scan-Id": scanId };

  try {
    return Response.json(await scanJobs(scanId, userId), { headers });
  } catch (error) {
    logJobsScraper("error", "scan.failed", scanId, {
      cause:
        error instanceof Error && error.cause instanceof Error
          ? {
              message: error.cause.message,
              name: error.cause.name,
            }
          : undefined,
      errorMessage:
        error instanceof Error ? error.message : "Unknown jobs scraper error",
      errorName: error instanceof Error ? error.name : "UnknownError",
      status: error instanceof GoogleApiError ? error.status : undefined,
    });

    if (error instanceof GoogleApiError && error.status === 429) {
      return Response.json(
        {
          error: "Gemini quota exceeded. Try again after the quota resets.",
          scanId,
        },
        { headers, status: 429 },
      );
    }

    if (error instanceof Crawl4AiUnavailableError) {
      return Response.json(
        {
          error: "Crawl4AI is offline. Start the crawl4ai Docker service.",
          scanId,
        },
        { headers, status: 503 },
      );
    }

    return Response.json(
      { error: "The job scan failed. Try again in a moment.", scanId },
      { headers, status: 500 },
    );
  }
}
