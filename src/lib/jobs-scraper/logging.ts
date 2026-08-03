export type JobsScraperLogLevel = "error" | "info" | "warn";

export interface JobsScraperLogEntry extends Record<string, unknown> {
  event: string;
  level: JobsScraperLogLevel;
  scanId: string;
  service: "jobs-scraper";
  timestamp: string;
}

export function createJobsScraperLog(
  level: JobsScraperLogLevel,
  event: string,
  scanId: string,
  fields: Record<string, unknown> = {},
): JobsScraperLogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    service: "jobs-scraper",
    event,
    scanId,
    ...fields,
  };
}

export function logJobsScraper(
  level: JobsScraperLogLevel,
  event: string,
  scanId: string,
  fields: Record<string, unknown> = {},
) {
  const line = JSON.stringify(
    createJobsScraperLog(level, event, scanId, fields),
  );

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}
