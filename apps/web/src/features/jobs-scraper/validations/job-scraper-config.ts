import { z } from "zod";

import {
  JOB_SOURCES,
  JOB_TIME_RANGES,
  JOB_WORK_MODES,
} from "@/features/jobs-scraper/lib/constants";
import { getTodayInManila, shiftDate } from "@/features/jobs-scraper/lib/date";

const criterionSchema = z.string().trim().min(1).max(80);
const criteriaSchema = z
  .array(criterionSchema)
  .max(30)
  .transform(uniqueStrings);

// Empty criteria can be saved; scan readiness is checked separately.
export const jobScraperConfigSchema = z
  .object({
    roles: criteriaSchema,
    includedLevels: criteriaSchema,
    requiredTechnologies: criteriaSchema,
    excludedLevels: criteriaSchema,
    excludedTechnologies: criteriaSchema,
    sources: z.array(z.enum(JOB_SOURCES)).min(1).transform(uniqueStrings),
    timeRange: z.enum(JOB_TIME_RANGES),
    customStartDate: z.iso.date().nullable(),
    customEndDate: z.iso.date().nullable(),
    worldwideWorkModes: z
      .array(z.enum(JOB_WORK_MODES))
      .transform(uniqueStrings),
    philippinesWorkModes: z
      .array(z.enum(JOB_WORK_MODES))
      .transform(uniqueStrings),
  })
  .superRefine((value, context) => {
    if (value.timeRange !== "CUSTOM") {
      return;
    }

    if (!value.customStartDate || !value.customEndDate) {
      context.addIssue({
        code: "custom",
        message: "Choose both custom range dates.",
        path: ["customStartDate"],
      });
      return;
    }

    const start = Date.parse(`${value.customStartDate}T00:00:00Z`);
    const end = Date.parse(`${value.customEndDate}T00:00:00Z`);
    const rangeDays = (end - start) / 86_400_000;
    const today = getTodayInManila();
    const earliestDate = shiftDate(today, -6);

    if (
      rangeDays < 0 ||
      rangeDays > 6 ||
      value.customStartDate < earliestDate ||
      value.customEndDate > today
    ) {
      context.addIssue({
        code: "custom",
        message: "Custom range must fall within the latest 7 days.",
        path: ["customEndDate"],
      });
    }
  });

export type JobScraperConfig = z.infer<typeof jobScraperConfigSchema>;

function uniqueStrings<T extends string>(values: T[]): T[] {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = value.toLowerCase();

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
