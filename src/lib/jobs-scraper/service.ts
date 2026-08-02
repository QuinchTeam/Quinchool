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
import {
  containsExcludedTech,
  filterDiscoveredJobs,
  filterPotentialJobs,
  getTodayInManila,
  type JobScanResult,
  jobExtractionSchema,
} from "@/lib/jobs-scraper/schema";

export async function scanJobs(): Promise<JobScanResult> {
  const scanDate = getTodayInManila();
  const { documents, sourceIssues } = await collectJobDocuments();
  const eligibleDocuments = documents.filter(
    (document) => !containsExcludedTech(document.content),
  );

  if (eligibleDocuments.length === 0) {
    return {
      jobs: [],
      potentialJobs: [],
      scanDate,
      scannedAt: new Date().toISOString(),
      sourceIssues,
    };
  }

  const providerModelId = getProviderModelId({
    modelId: DEFAULT_TEXT_GENERATION_MODEL_ID,
    providerId: TEXT_GENERATION_PROVIDER_IDS.GOOGLE_AI_STUDIO,
  });
  const text = await generateGoogleJson({
    providerModelId,
    responseJsonSchema: z.toJSONSchema(jobExtractionSchema),
    prompt: buildExtractionPrompt(scanDate, eligibleDocuments),
  });
  const result = jobExtractionSchema.parse(JSON.parse(text) as unknown);
  const jobs = filterDiscoveredJobs(result.jobs, scanDate);
  const matchedUrls = new Set(jobs.map((job) => job.url.toLowerCase()));

  return {
    jobs,
    potentialJobs: filterPotentialJobs(result.potentialJobs, scanDate).filter(
      (job) => !matchedUrls.has(job.url.toLowerCase()),
    ),
    scanDate,
    scannedAt: new Date().toISOString(),
    sourceIssues,
  };
}

function buildExtractionPrompt(
  scanDate: string,
  documents: JobDocument[],
): string {
  const crawledDocuments = documents
    .map(
      (document, index) =>
        `DOCUMENT ${index + 1}\nSOURCE: ${document.source}\nURL: ${document.url}\n${document.content}`,
    )
    .join("\n\n---\n\n");

  return `Extract qualifying job listings from the crawled documents below. Do not search the web and do not invent missing details.

Rules:
- Title must be Software Developer, Full Stack Developer, Software Engineer, or Full Stack Engineer.
- Seniority must be entry, junior, or mid level. Exclude Senior/Sr, Lead, Manager, Staff, Principal, Director, Head, CTO, executive roles, and listings marked Senior level.
- The full document must mention React or a React framework, TypeScript, Node.js, Express, NestJS, Fastify, FastAPI, AI/LLM integration, PostgreSQL, MySQL, or SQL.
- Include Remote jobs worldwide. Include Hybrid jobs only in the Philippines. Exclude On-site jobs.
- Exclude a listing if the full document mentions C#, .NET, dotnet, Java, OOP, object-oriented programming, NoSQL, MongoDB, DynamoDB, Cassandra, Firestore, Cosmos DB, Neo4j, or Redis. JavaScript is not Java.
- Include only listings explicitly posted today. Treat minutes or hours ago as today. Exclude listings posted one day ago or earlier. Use ${scanDate} exactly as postedDate.
- Use the document's SOURCE and exact URL. LinkedIn URLs must start with https://www.linkedin.com/jobs/view/ and JobStreet URLs must start with https://ph.jobstreet.com/job/. Return at most one job per document and at most 25 jobs total.
- The summary must briefly state the qualifying stack and work arrangement.

Return strict matches in jobs. Return promising listings that need manual review in potentialJobs when the title and seniority qualify but exactly one or more of these are missing or unclear: today's posting date, Remote/Hybrid work mode, or the required stack. Set an unknown date to null and an unknown work mode to Unclear, and explain each missing criterion in reviewReasons.

Never return an explicit On-site listing, a foreign Hybrid listing, a forbidden technology, an excluded seniority, an invalid source URL, or a listing older than today in either list. Do not duplicate a URL between jobs and potentialJobs.

CRAWLED DOCUMENTS:
${crawledDocuments}`;
}
