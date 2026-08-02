import "server-only";

import { z } from "zod";

import {
  getJobSourceFromUrl,
  JOB_ROLES,
  JOB_SOURCES,
  JOB_URL_PREFIXES,
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

export async function collectJobDocuments(): Promise<{
  documents: JobDocument[];
  sourceIssues: JobSourceIssue[];
}> {
  const searchResults = await crawlUrls(buildSearchUrls());
  const sourceIssues: JobSourceIssue[] = [];
  const detailUrls = new Map<JobSource, string[]>();

  for (const source of JOB_SOURCES) {
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

  const detailResults = await crawlUrls([...detailUrls.values()].flat());
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

  for (const source of JOB_SOURCES) {
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

  return { documents, sourceIssues };
}

function buildSearchUrls(): string[] {
  return JOB_ROLES.flatMap((role) => {
    const encodedRole = encodeURIComponent(role);
    const slug = role.toLowerCase().replaceAll(" ", "-");

    return [
      `https://www.linkedin.com/jobs/search/?keywords=${encodedRole}&location=Philippines&f_TPR=r86400&f_WT=2%2C3&f_E=2%2C3`,
      `https://www.linkedin.com/jobs/search/?keywords=${encodedRole}&location=Worldwide&f_TPR=r86400&f_WT=2&f_E=2%2C3`,
      `https://ph.jobstreet.com/${slug}-jobs?daterange=1`,
    ];
  });
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
