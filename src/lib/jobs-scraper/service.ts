import "server-only";

import { z } from "zod";
import {
  DEFAULT_TEXT_GENERATION_MODEL_ID,
  getProviderModelId,
} from "@/lib/ai/text-generation/models";
import { generateGoogleJson } from "@/lib/ai/text-generation/providers/google-ai-studio";
import { TEXT_GENERATION_PROVIDER_IDS } from "@/lib/ai/text-generation/types";
import {
  collectJobDocuments,
  type JobDocument,
} from "@/lib/jobs-scraper/crawler";
import { logJobsScraper } from "@/lib/jobs-scraper/logging";
import {
  containsExcludedTech,
  type DiscoveredJob,
  filterDiscoveredJobs,
  filterPotentialJobs,
  getJobDateWindow,
  type JobScraperConfig,
  type JobScraperState,
  jobExtractionSchema,
  type PotentialJob,
  parseJobExtraction,
} from "@/lib/jobs-scraper/schema";
import {
  getJobScraperConfig,
  getJobScraperState,
  persistJobScan,
} from "@/lib/jobs-scraper/storage";

export async function scanJobs(
  scanId: string,
  userId: string,
): Promise<JobScraperState> {
  const scanStartedAt = Date.now();
  const scannedAt = new Date();
  const config = await getJobScraperConfig(userId);
  const dateWindow = getJobDateWindow(config, scannedAt);

  logJobsScraper("info", "scan.started", scanId, {
    dateWindow,
    roles: config.roles,
    sources: config.sources,
    timeRange: config.timeRange,
    workModes: {
      philippines: config.philippinesWorkModes,
      worldwide: config.worldwideWorkModes,
    },
  });

  const { documents, sourceIssues } = await collectJobDocuments(scanId, config);
  const eligibleDocuments = documents.filter(
    (document) =>
      !containsExcludedTech(document.content, config.excludedTechnologies),
  );
  const excludedDocuments = documents.filter((document) =>
    containsExcludedTech(document.content, config.excludedTechnologies),
  );

  logJobsScraper("info", "documents.filtered", scanId, {
    eligible: eligibleDocuments.map(({ source, url }) => ({ source, url })),
    eligibleCount: eligibleDocuments.length,
    excluded: excludedDocuments.map(({ source, url }) => ({
      reason: "excluded_technology",
      source,
      url,
    })),
    excludedCount: excludedDocuments.length,
    inputCount: documents.length,
  });

  if (eligibleDocuments.length === 0) {
    logJobsScraper("info", "gemini.skipped", scanId, {
      reason: "no_eligible_documents",
    });
    await persistJobScan(userId, scanId, scannedAt, []);
    const state = await getJobScraperState(userId, sourceIssues);

    logCompletedScan(scanId, scanStartedAt, state);
    return state;
  }

  const providerModelId = getProviderModelId({
    modelId: DEFAULT_TEXT_GENERATION_MODEL_ID,
    providerId: TEXT_GENERATION_PROVIDER_IDS.GOOGLE_AI_STUDIO,
  });
  const geminiStartedAt = Date.now();
  const text = await generateGoogleJson({
    providerModelId,
    responseJsonSchema: z.toJSONSchema(jobExtractionSchema),
    prompt: buildExtractionPrompt(scannedAt, config, eligibleDocuments),
  });
  const result = parseJobExtraction(JSON.parse(text) as unknown);

  logJobsScraper("info", "gemini.classification.completed", scanId, {
    durationMs: Date.now() - geminiStartedAt,
    matchCandidates: result.jobs.map(toLoggedJob),
    model: providerModelId,
    potentialCandidates: result.potentialJobs.map(toLoggedJob),
  });

  const jobs = filterDiscoveredJobs(result.jobs, config, scannedAt);
  const matchedUrls = new Set(jobs.map((job) => job.url.toLowerCase()));
  const potentialJobs = filterPotentialJobs(
    result.potentialJobs,
    config,
    scannedAt,
  ).filter((job) => !matchedUrls.has(job.url.toLowerCase()));
  const potentialUrls = new Set(
    potentialJobs.map((job) => job.url.toLowerCase()),
  );

  logJobsScraper("info", "selection.completed", scanId, {
    matches: jobs.map(toLoggedJob),
    potentialMatches: potentialJobs.map(toLoggedJob),
    rejectedMatchUrls: result.jobs
      .filter((job) => !matchedUrls.has(job.url.toLowerCase()))
      .map((job) => job.url),
    rejectedPotentialUrls: result.potentialJobs
      .filter((job) => !potentialUrls.has(job.url.toLowerCase()))
      .map((job) => job.url),
  });

  const descriptions = new Map(
    eligibleDocuments.map((document) => [
      document.url.toLowerCase(),
      document.content,
    ]),
  );
  await persistJobScan(userId, scanId, scannedAt, [
    ...jobs.map((job) => ({
      classification: "MATCH" as const,
      description: descriptions.get(job.url.toLowerCase()) ?? "",
      job,
    })),
    ...potentialJobs.map((job) => ({
      classification: "POTENTIAL" as const,
      description: descriptions.get(job.url.toLowerCase()) ?? "",
      job,
    })),
  ]);

  const state = await getJobScraperState(userId, sourceIssues);
  logJobsScraper("info", "jobs.persisted", scanId, {
    newJobCount: state.newJobCount,
    savedJobCount: state.savedJobCount,
  });
  logCompletedScan(scanId, scanStartedAt, state);
  return state;
}

function logCompletedScan(
  scanId: string,
  scanStartedAt: number,
  state: JobScraperState,
) {
  logJobsScraper(
    state.sourceIssues.length ? "warn" : "info",
    "scan.completed",
    scanId,
    {
      durationMs: Date.now() - scanStartedAt,
      matchCount: state.jobs.filter((job) => job.classification === "MATCH")
        .length,
      newJobCount: state.newJobCount,
      potentialCount: state.jobs.filter(
        (job) => job.classification === "POTENTIAL",
      ).length,
      savedJobCount: state.savedJobCount,
      sourceIssues: state.sourceIssues,
    },
  );
}

function toLoggedJob(job: DiscoveredJob | PotentialJob) {
  return {
    company: job.company,
    country: job.country,
    level: job.level,
    location: job.location,
    matchedSkills: job.matchedSkills,
    postedAt: job.postedAt,
    postedDate: job.postedDate,
    source: job.source,
    title: job.title,
    url: job.url,
    workMode: job.workMode,
    ...("reviewReasons" in job ? { reviewReasons: job.reviewReasons } : {}),
  };
}

function buildExtractionPrompt(
  scannedAt: Date,
  config: JobScraperConfig,
  documents: JobDocument[],
): string {
  const dateWindow = getJobDateWindow(config, scannedAt);
  const crawledDocuments = documents
    .map(
      (document, index) =>
        `DOCUMENT ${index + 1}\nSOURCE: ${document.source}\nURL: ${document.url}\n${document.content}`,
    )
    .join("\n\n---\n\n");
  const requiredTechnologyRule =
    config.requiredTechnologies.length > 0
      ? `The listing must mention at least one of: ${config.requiredTechnologies.join(", ")}.`
      : "No technology is required.";
  const dateRule =
    config.timeRange === "LAST_HOUR"
      ? `Include only listings explicitly posted during the last hour relative to ${scannedAt.toISOString()}. Convert an explicit relative time such as "35 minutes ago" to postedAt; if it cannot be established, return the listing as potential.`
      : `Include only listings posted from ${dateWindow.fromDate} through ${dateWindow.toDate}, inclusive.`;

  return `Extract qualifying job listings from the crawled documents below. Do not search the web and do not invent missing details.

User criteria:
- Roles: ${config.roles.join(", ")}.
- Included levels: ${config.includedLevels.join(", ")}.
- Excluded levels: ${config.excludedLevels.join(", ")}.
- ${requiredTechnologyRule}
- Excluded technologies: ${config.excludedTechnologies.join(", ") || "none"}.
- Worldwide work modes: ${config.worldwideWorkModes.join(", ") || "none"}.
- Additional work modes allowed for jobs in the Philippines: ${config.philippinesWorkModes.join(", ") || "none"}.
- ${dateRule}

Rules:
- A title must match one configured role. The level must match an included level and must not match an excluded level.
- Worldwide modes apply to every country. Philippines modes apply only when the job country is the Philippines.
- Exclude any listing that mentions a configured excluded technology. JavaScript is not Java.
- Use the document's SOURCE and exact URL. LinkedIn URLs must start with https://www.linkedin.com/jobs/view/ and JobStreet URLs must start with https://ph.jobstreet.com/job/.
- Set postedDate to the Philippine calendar date. Preserve the site's visible posting label in postedText. Set postedAt only when an exact timestamp or an explicit relative posting time can support it.
- Return at most one job per document and at most 25 jobs total. The summary must state the relevant stack and work arrangement.

Return listings satisfying every criterion in jobs. Return promising listings in potentialJobs only when the role and level qualify but the date, work mode, or required technology is missing or unclear. Explain each uncertainty in reviewReasons. Never return an excluded level, excluded technology, invalid source URL, explicit disallowed work mode, or listing outside the configured date range in either list. Do not duplicate a URL.

SCAN TIME: ${scannedAt.toISOString()}

CRAWLED DOCUMENTS:
${crawledDocuments}`;
}
