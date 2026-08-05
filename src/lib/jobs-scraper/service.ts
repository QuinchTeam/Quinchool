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
  type DiscoveredJob,
  getJobDateWindow,
  getJobRejectionReasons,
  type JobScraperConfig,
  type JobScraperState,
  jobExtractionSchema,
  type PotentialJob,
  parseJobExtraction,
  type SavedJob,
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

  logJobsScraper("info", "documents.collected", scanId, {
    documents: documents.map(({ source, url }) => ({ source, url })),
    documentCount: documents.length,
  });

  if (documents.length === 0) {
    logJobsScraper("info", "gemini.skipped", scanId, {
      reason: "no_documents",
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
    prompt: buildExtractionPrompt(scannedAt, config, documents),
  });
  const result = parseJobExtraction(JSON.parse(text) as unknown);

  logJobsScraper("info", "gemini.classification.completed", scanId, {
    durationMs: Date.now() - geminiStartedAt,
    matchCandidates: result.jobs.map(toLoggedJob),
    model: providerModelId,
    potentialCandidates: result.potentialJobs.map(toLoggedJob),
    rejectedCandidates: result.rejectedJobs.map(toLoggedJob),
  });

  const descriptions = new Map(
    documents.map((document) => [document.url.toLowerCase(), document.content]),
  );
  const classified = classifyScannedJobs(result, config, scannedAt).map(
    (entry) => ({
      ...entry,
      description: descriptions.get(entry.job.url.toLowerCase()) ?? "",
    }),
  );

  logJobsScraper("info", "selection.completed", scanId, {
    jobs: classified.map(({ classification, job, reviewReasons }) => ({
      ...toLoggedJob(job),
      classification,
      reviewReasons,
    })),
  });

  await persistJobScan(userId, scanId, scannedAt, classified);

  const state = await getJobScraperState(userId, sourceIssues);
  logJobsScraper("info", "jobs.persisted", scanId, {
    newJobCount: state.newJobCount,
    savedJobCount: state.savedJobCount,
  });
  logCompletedScan(scanId, scanStartedAt, state);
  return state;
}

/**
 * Grades every extracted listing against the configured criteria and settles it
 * into one bucket. A listing Gemini proposed as a match or a potential match is
 * demoted to REJECTED when the deterministic criteria disagree, and it carries
 * the reasons for that verdict so the scan stays reviewable.
 */
export function classifyScannedJobs(
  result: {
    jobs: DiscoveredJob[];
    potentialJobs: PotentialJob[];
    rejectedJobs: PotentialJob[];
  },
  config: JobScraperConfig,
  scannedAt: Date,
): {
  classification: SavedJob["classification"];
  job: DiscoveredJob | PotentialJob;
  reviewReasons: string[];
}[] {
  const candidates = [
    ...result.jobs.map((job) => ({ job, proposed: "MATCH" as const })),
    ...result.potentialJobs.map((job) => ({
      job,
      proposed: "POTENTIAL" as const,
    })),
    ...result.rejectedJobs.map((job) => ({
      job,
      proposed: "REJECTED" as const,
    })),
  ];
  const seen = new Set<string>();

  return candidates.flatMap(({ job, proposed }) => {
    const dedupeKey = job.url.toLowerCase();

    if (seen.has(dedupeKey)) {
      return [];
    }

    seen.add(dedupeKey);
    const failures = getJobRejectionReasons(job, config, scannedAt);
    const classification =
      proposed === "REJECTED" || failures.length > 0 ? "REJECTED" : proposed;
    const modelReasons = "reviewReasons" in job ? job.reviewReasons : [];

    return [
      {
        classification,
        job,
        reviewReasons: [...new Set([...modelReasons, ...failures])].slice(0, 6),
      },
    ];
  });
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
      classificationCounts: state.classificationCounts,
      durationMs: Date.now() - scanStartedAt,
      newJobCount: state.newJobCount,
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
- A listing that mentions a configured excluded technology does not qualify. JavaScript is not Java.
- Use the document's SOURCE and exact URL. LinkedIn URLs must start with https://www.linkedin.com/jobs/view/ and JobStreet URLs must start with https://ph.jobstreet.com/job/.
- Write every field in English. If the document is in another language, translate it, including the country name and the posting label.
- Set postedDate to the Philippine calendar date. Preserve the site's visible posting label in postedText. Set postedAt only when an exact timestamp or an explicit relative posting time can support it.
- Return exactly one entry per document, in exactly one of the three lists, and never repeat a URL. Every document must be accounted for. The summary must state the relevant stack and work arrangement.

Classify each document into one list:
- jobs: it satisfies every criterion above.
- potentialJobs: the role and level qualify, but the date, work mode, or required technology is missing or unclear from the document. Explain each uncertainty in reviewReasons.
- rejectedJobs: it fails at least one criterion, or the document is not a readable job listing. State every disqualifying detail in reviewReasons, most important first, each one specific (name the excluded technology, the seniority wording, the country, or the posting date you read).

Write reviewReasons as short sentences addressed to the person reviewing the scan, so they can judge whether the verdict was correct. Fill in as much of the listing as the document supports even when rejecting it; use "Unclear" for an unknown work mode and null for an unknown posting date.

SCAN TIME: ${scannedAt.toISOString()}

CRAWLED DOCUMENTS:
${crawledDocuments}`;
}
