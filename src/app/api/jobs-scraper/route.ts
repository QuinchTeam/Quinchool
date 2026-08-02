import { ApiError as GoogleApiError } from "@google/genai";

import { Crawl4AiUnavailableError } from "@/lib/jobs-scraper/crawler";
import { scanJobs } from "@/lib/jobs-scraper/service";
import { getSessionUserId } from "@/lib/session";

export const maxDuration = 300;

export async function POST() {
  const userId = await getSessionUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return Response.json(await scanJobs());
  } catch (error) {
    console.error("jobs-scraper error", error);

    if (error instanceof GoogleApiError && error.status === 429) {
      return Response.json(
        { error: "Gemini quota exceeded. Try again after the quota resets." },
        { status: 429 },
      );
    }

    if (error instanceof Crawl4AiUnavailableError) {
      return Response.json(
        { error: "Crawl4AI is offline. Start the crawl4ai Docker service." },
        { status: 503 },
      );
    }

    return Response.json(
      { error: "The job scan failed. Try again in a moment." },
      { status: 500 },
    );
  }
}
