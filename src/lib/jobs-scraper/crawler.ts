import "server-only";

import { z } from "zod";
import { logJobsScraper } from "@/lib/jobs-scraper/logging";
import {
  getCrawlLookbackSeconds,
  getJobSourceFromUrl,
  JOB_SOURCES,
  JOB_URL_PREFIXES,
  type JobScraperConfig,
  type JobSourceIssue,
} from "@/lib/jobs-scraper/schema";

const CRAWL4AI_URL = (
  process.env.CRAWL4AI_URL ?? "http://127.0.0.1:11235"
).replace(/\/$/, "");
const MAX_JOBS_PER_SOURCE = 10;
const MAX_DOCUMENT_LENGTH = 12_000;

const crawlLinkSchema = z.object({ href: z.string() }).passthrough();
const crawlResultSchema = z
  .object({
    error_message: z.string().nullish(),
    links: z
      .object({
        external: z.array(crawlLinkSchema).default([]),
        internal: z.array(crawlLinkSchema).default([]),
      })
      .default({ external: [], internal: [] }),
    markdown: z
      .union([
        z.string(),
        z.object({ raw_markdown: z.string().optional() }).passthrough(),
        z.null(),
      ])
      .optional(),
    status_code: z.number().nullable().optional(),
    success: z.boolean(),
    url: z.string(),
  })
  .passthrough();
const crawlResponseSchema = z.object({
  results: z.array(crawlResultSchema),
  success: z.boolean(),
});

type JobSource = (typeof JOB_SOURCES)[number];
type CrawlResult = z.infer<typeof crawlResultSchema>;

export interface JobDocument {
  content: string;
  source: JobSource;
  url: string;
}

export class Crawl4AiUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Crawl4AI is unavailable", { cause });
    this.name = "Crawl4AiUnavailableError";
  }
}

export async function collectJobDocuments(
  scanId: string,
  config: JobScraperConfig,
): Promise<{
  documents: JobDocument[];
  sourceIssues: JobSourceIssue[];
}> {
  const searchUrls = buildSearchUrls(config);
  const searchStartedAt = Date.now();
  const searchResults = await crawlUrls(searchUrls);

  logJobsScraper("info", "crawl.search.completed", scanId, {
    durationMs: Date.now() - searchStartedAt,
    sources: summarizeCrawlBatch(searchUrls, searchResults),
  });

  const sourceIssues: JobSourceIssue[] = [];
  const detailUrls = new Map<JobSource, string[]>();

  for (const source of config.sources) {
    const sourceSearchResults = searchResults.filter(
      (result) => getJobSourceFromUrl(result.url) === source,
    );
    const urls = extractJobUrls(sourceSearchResults, source).slice(
      0,
      MAX_JOBS_PER_SOURCE,
    );

    detailUrls.set(source, urls);

    if (urls.length === 0) {
      sourceIssues.push({
        source,
        message: sourceSearchResults.some(isBlocked)
          ? "The source blocked automated access."
          : "No current job links were available.",
      });
    }
  }

  logJobsScraper("info", "crawl.links.selected", scanId, {
    sources: Object.fromEntries(
      [...detailUrls].map(([source, urls]) => [
        source,
        { count: urls.length, urls },
      ]),
    ),
  });

  const selectedDetailUrls = [...detailUrls.values()].flat();
  const detailsStartedAt = Date.now();
  const detailResults = await crawlUrls(selectedDetailUrls);
  const documents = detailResults.flatMap((result) => {
    const source = getJobSourceFromUrl(result.url);
    const content = readMarkdown(result);

    if (!source || !result.success || isBlocked(result) || !content) {
      return [];
    }

    return [
      {
        content: content.slice(0, MAX_DOCUMENT_LENGTH),
        source,
        url: normalizeJobUrl(result.url, source),
      },
    ];
  });

  for (const source of config.sources) {
    if (
      (detailUrls.get(source)?.length ?? 0) > 0 &&
      !documents.some((document) => document.source === source)
    ) {
      sourceIssues.push({
        source,
        message: "Job links were found, but their details could not be read.",
      });
    }
  }

  logJobsScraper(
    sourceIssues.length ? "warn" : "info",
    "crawl.details.completed",
    scanId,
    {
      durationMs: Date.now() - detailsStartedAt,
      issues: sourceIssues,
      sources: Object.fromEntries(
        JOB_SOURCES.map((source) => [
          source,
          {
            ...summarizeSourceCrawl(source, selectedDetailUrls, detailResults),
            documents: documents
              .filter((document) => document.source === source)
              .map((document) => document.url),
          },
        ]),
      ),
    },
  );

  return { documents, sourceIssues };
}

function buildSearchUrls(config: JobScraperConfig): string[] {
  const lookbackSeconds = getCrawlLookbackSeconds(config);
  const jobStreetDays = lookbackSeconds <= 86_400 ? 1 : 7;

  return config.roles.flatMap((role) => {
    const encodedRole = encodeURIComponent(role);
    const slug = role.toLowerCase().replaceAll(" ", "-");
    const urls: string[] = [];

    if (config.sources.includes("LinkedIn")) {
      if (config.philippinesWorkModes.length > 0) {
        urls.push(
          buildLinkedInSearchUrl(
            encodedRole,
            "Philippines",
            config.philippinesWorkModes,
            lookbackSeconds,
          ),
        );
      }

      if (config.worldwideWorkModes.length > 0) {
        urls.push(
          buildLinkedInSearchUrl(
            encodedRole,
            "Worldwide",
            config.worldwideWorkModes,
            lookbackSeconds,
          ),
        );
      }
    }

    if (config.sources.includes("JobStreet")) {
      urls.push(
        `https://ph.jobstreet.com/${slug}-jobs?daterange=${jobStreetDays}`,
      );
    }

    return urls;
  });
}

function buildLinkedInSearchUrl(
  encodedRole: string,
  location: string,
  workModes: JobScraperConfig["worldwideWorkModes"],
  lookbackSeconds: number,
): string {
  const workModeIds = { Hybrid: "3", Onsite: "1", Remote: "2" } as const;
  const encodedModes = encodeURIComponent(
    workModes.map((mode) => workModeIds[mode]).join(","),
  );

  return `https://www.linkedin.com/jobs/search/?keywords=${encodedRole}&location=${encodeURIComponent(location)}&f_TPR=r${lookbackSeconds}&f_WT=${encodedModes}`;
}

async function crawlUrls(urls: string[]): Promise<CrawlResult[]> {
  if (urls.length === 0) {
    return [];
  }

  let response: Response;

  try {
    response = await fetch(`${CRAWL4AI_URL}/crawl`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(180_000),
      body: JSON.stringify({
        urls,
        browser_config: {
          type: "BrowserConfig",
          params: {
            enable_stealth: true,
            headless: true,
            user_agent_mode: "random",
          },
        },
        crawler_config: {
          type: "CrawlerRunConfig",
          params: {
            cache_mode: "bypass",
            magic: true,
            page_timeout: 60_000,
            stream: false,
          },
        },
      }),
    });
  } catch (error) {
    throw new Crawl4AiUnavailableError(error);
  }

  if (!response.ok) {
    throw new Crawl4AiUnavailableError();
  }

  const parsed = crawlResponseSchema.safeParse(await response.json());

  if (
    !parsed.success ||
    (!parsed.data.success && !parsed.data.results.length)
  ) {
    throw new Crawl4AiUnavailableError(parsed.error);
  }

  return parsed.data.results;
}

function extractJobUrls(results: CrawlResult[], source: JobSource): string[] {
  const urls = new Set<string>();

  for (const result of results) {
    for (const link of [...result.links.internal, ...result.links.external]) {
      const normalized = normalizeJobUrl(link.href, source);

      if (normalized) {
        urls.add(normalized);
      }
    }
  }

  return [...urls];
}

function normalizeJobUrl(url: string, source: JobSource): string {
  try {
    const parsed = new URL(url);

    if (getJobSourceFromUrl(parsed.href) !== source) {
      return "";
    }

    if (source === "LinkedIn") {
      if (!/^\/jobs\/view\//.test(parsed.pathname)) {
        return "";
      }

      parsed.hostname = new URL(JOB_URL_PREFIXES.LinkedIn).hostname;
    } else {
      if (!/^\/job\/\d+/.test(parsed.pathname)) {
        return "";
      }

      parsed.hostname = new URL(JOB_URL_PREFIXES.JobStreet).hostname;
    }

    parsed.protocol = "https:";
    parsed.port = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.href;
  } catch {
    return "";
  }
}

function readMarkdown(result: CrawlResult): string {
  if (typeof result.markdown === "string") {
    return result.markdown;
  }

  return result.markdown?.raw_markdown ?? "";
}

function isBlocked(result: CrawlResult): boolean {
  return /additional verification required|just a moment|access denied|captcha/i.test(
    `${result.error_message ?? ""} ${readMarkdown(result)}`,
  );
}

function summarizeCrawlBatch(urls: string[], results: CrawlResult[]) {
  return Object.fromEntries(
    JOB_SOURCES.map((source) => [
      source,
      summarizeSourceCrawl(source, urls, results),
    ]),
  );
}

function summarizeSourceCrawl(
  source: JobSource,
  urls: string[],
  results: CrawlResult[],
) {
  const sourceResults = results.filter(
    (result) => getJobSourceFromUrl(result.url) === source,
  );

  return {
    requestedCount: urls.filter((url) => getJobSourceFromUrl(url) === source)
      .length,
    returnedCount: sourceResults.length,
    successfulCount: sourceResults.filter((result) => result.success).length,
    blockedCount: sourceResults.filter(isBlocked).length,
  };
}
