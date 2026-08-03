"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  JobScraperConfig,
  JobScraperState,
} from "@/lib/jobs-scraper/schema";

const JOBS_SCRAPER_KEY = ["jobs-scraper"] as const;

async function requestJobsScraper(
  init?: RequestInit,
): Promise<JobScraperState> {
  const response = await fetch("/api/jobs-scraper", {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = (await response.json().catch(() => null)) as
    | JobScraperState
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      body && "error" in body && body.error
        ? body.error
        : "Jobs scraper request failed.",
    );
  }

  return body as JobScraperState;
}

export function useJobsScraper() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: JOBS_SCRAPER_KEY,
    queryFn: () => requestJobsScraper(),
  });
  const scan = useMutation({
    mutationFn: () => requestJobsScraper({ method: "POST" }),
    onSuccess: (state) => queryClient.setQueryData(JOBS_SCRAPER_KEY, state),
  });
  const saveConfig = useMutation({
    mutationFn: (config: JobScraperConfig) =>
      requestJobsScraper({ method: "PUT", body: JSON.stringify(config) }),
    onSuccess: (state) => queryClient.setQueryData(JOBS_SCRAPER_KEY, state),
  });

  return {
    isError: query.isError,
    isLoading: query.isLoading,
    refetch: query.refetch,
    saveConfig,
    scan,
    state: query.data,
  };
}
