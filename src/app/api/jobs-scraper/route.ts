import { randomUUID } from "node:crypto";
import { ApiError as GoogleApiError } from "@google/genai";
import { z } from "zod";

import { readProviderErrorMessage } from "@/lib/ai/text-generation/errors";
import { Crawl4AiUnavailableError } from "@/lib/jobs-scraper/crawler";
import { logJobsScraper } from "@/lib/jobs-scraper/logging";
import {
  jobClassificationSchema,
  jobScraperConfigSchema,
} from "@/lib/jobs-scraper/schema";
import { scanJobs } from "@/lib/jobs-scraper/service";
import {
  getJobScraperState,
  saveJobScraperConfig,
  updateJobClassification,
} from "@/lib/jobs-scraper/storage";
import { getSessionUserId } from "@/lib/session";

export const maxDuration = 300;

const classificationUpdateSchema = z.object({
  classification: jobClassificationSchema,
  id: z.string().min(1),
});

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

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = classificationUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid job update" }, { status: 400 });
  }

  const updated = await updateJobClassification(
    userId,
    parsed.data.id,
    parsed.data.classification,
  );

  if (!updated) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

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
    const failure = getScanFailure(error);

    logJobsScraper("error", "scan.failed", scanId, {
      cause:
        error instanceof Error && error.cause instanceof Error
          ? {
              message: error.cause.message,
              name: error.cause.name,
            }
          : undefined,
      errorMessage: failure.error,
      errorName: error instanceof Error ? error.name : "UnknownError",
      providerStatus:
        error instanceof GoogleApiError ? error.status : undefined,
      status: failure.status,
    });

    return Response.json(
      { error: failure.error, scanId },
      { headers, status: failure.status },
    );
  }
}

/**
 * Turns a scan failure into the sentence the user reads. Gemini's own wording
 * says more than any generic message can — whether the model is overloaded,
 * the quota is spent, or the request was rejected — so it is passed through.
 */
function getScanFailure(error: unknown): { error: string; status: number } {
  if (error instanceof Crawl4AiUnavailableError) {
    return {
      error: "Crawl4AI is offline. Start the crawl4ai Docker service.",
      status: 503,
    };
  }

  if (error instanceof GoogleApiError) {
    const detail = readProviderErrorMessage(error);

    if (error.status === 429) {
      return {
        error: `Gemini quota exceeded. ${detail ?? "Try again after the quota resets."}`,
        status: 429,
      };
    }

    return {
      error: `Gemini could not classify this scan. ${detail ?? `The API returned ${error.status}.`}`,
      // ponytail: Google's status is already an HTTP code; forward it so a 503
      // still reads as "retry later" instead of a flat server error.
      status: error.status >= 400 && error.status <= 599 ? error.status : 502,
    };
  }

  return {
    error:
      error instanceof Error
        ? `The job scan failed. ${error.message}`
        : "The job scan failed. Try again in a moment.",
    status: 500,
  };
}
