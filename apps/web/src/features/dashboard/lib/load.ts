import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";
import type {
  FinanceOverview,
  Transaction,
} from "@/features/finance-tracker/lib/types";
import type { JobScraperState } from "@/features/jobs-scraper/lib/types";
import { apiUrl, readApiData } from "@/lib/api";
import { apiFetch, observeOperation } from "@/lib/observability/operation";

// A failed tile request returns null so other dashboard tiles can still render.
async function load<T>(path: string): Promise<T | null> {
  try {
    const cookie = (await cookies()).toString();
    return await observeOperation("dashboard.tile", async () => {
      const response = await apiFetch(apiUrl(path), {
        headers: { cookie },
        cache: "no-store",
      });
      return readApiData<T | null>(response, "Dashboard tile failed");
    });
  } catch {
    return null;
  }
}

// cache() dedupes per request, so sections sharing data trigger one fetch.
export const loadFinance = cache(() =>
  load<FinanceOverview>("/finance-tracker"),
);
export const loadJobs = cache(() => load<JobScraperState>("/jobs-scraper"));
export const loadCareer = cache(() =>
  load<CareerProfileValues>("/career-profile"),
);
export const loadRecentTransactions = cache(() =>
  load<Transaction[]>("/finance-tracker/transactions?limit=5"),
);
