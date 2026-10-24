import { JOB_TIME_RANGE_LABELS } from "@/features/jobs-scraper/lib/constants";
import type { JobScraperConfig } from "@/features/jobs-scraper/validations/job-scraper-config";

export function getUnsetScanCriteria(config: JobScraperConfig): string[] {
  return [
    config.roles.length === 0 ? "a role" : "",
    config.includedLevels.length === 0 ? "a level" : "",
    config.sources.length === 0 ? "a source" : "",
    config.worldwideWorkModes.length === 0 &&
    config.philippinesWorkModes.length === 0
      ? "a location and work mode"
      : "",
  ].filter(Boolean);
}

export function formatTimeRange(config: JobScraperConfig): string {
  if (config.timeRange !== "CUSTOM") {
    return JOB_TIME_RANGE_LABELS[config.timeRange];
  }
  return `${config.customStartDate ?? "Custom"} to ${config.customEndDate ?? "range"}`;
}

export function formatLocationModes(config: JobScraperConfig): string {
  const worldwide = config.worldwideWorkModes.join(", ");
  const philippines = config.philippinesWorkModes.join(", ");
  return [
    worldwide ? `Worldwide: ${worldwide}` : "",
    philippines ? `Philippines: ${philippines}` : "",
  ]
    .filter(Boolean)
    .join(" / ");
}
