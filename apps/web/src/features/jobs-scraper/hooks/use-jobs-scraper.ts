"use client";

import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  JobScraperState,
  SavedJob,
} from "@/features/jobs-scraper/lib/types";
import type { JobScraperConfig } from "@/features/jobs-scraper/validations/job-scraper-config";
import { apiUrl, readApiData, withCredentials } from "@/lib/api";
import { apiFetch, observeOperation } from "@/lib/observability/operation";

const JOBS_SCRAPER_KEY = ["jobs-scraper"] as const;
const SCAN_KEY = [...JOBS_SCRAPER_KEY, "scan"] as const;

async function requestJobsScraper(
  path = "",
  init?: RequestInit,
): Promise<JobScraperState> {
  return observeOperation("jobs-scraper.request", async () => {
    const response = await apiFetch(apiUrl(`/jobs-scraper${path}`), {
      ...withCredentials,
      headers: { "Content-Type": "application/json" },
      ...init,
    });

    return readApiData<JobScraperState>(
      response,
      "Jobs scraper request failed.",
    );
  });
}

export function useJobsScraper() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: JOBS_SCRAPER_KEY,
    queryFn: () => requestJobsScraper(),
    // Scans run in the background on the API; poll until it finishes.
    refetchInterval: (current) =>
      current.state.data?.scan.status === "RUNNING" ? 3000 : false,
  });
  const scan = useMutation({
    mutationKey: SCAN_KEY,
    mutationFn: () => requestJobsScraper("/scans", { method: "POST" }),
    onSuccess: (state) => queryClient.setQueryData(JOBS_SCRAPER_KEY, state),
  });
  const saveConfig = useMutation({
    mutationFn: (config: JobScraperConfig) =>
      requestJobsScraper("/config", {
        method: "PUT",
        body: JSON.stringify(config),
      }),
    onSuccess: (state) => queryClient.setQueryData(JOBS_SCRAPER_KEY, state),
  });

  const updateClassification = useMutation({
    mutationFn: ({
      classification,
      id,
    }: {
      classification: SavedJob["classification"];
      id: string;
    }) =>
      requestJobsScraper(`/jobs/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ classification }),
      }),
    onSuccess: (state) => queryClient.setQueryData(JOBS_SCRAPER_KEY, state),
  });

  return {
    error: query.error,
    isLoading: query.isLoading,
    refetch: query.refetch,
    saveConfig,
    scan,
    state: query.data,
    updateClassification,
  };
}

// Read from the server state, so a refreshed page still knows a scan is running or failed.
export function useScanStatus() {
  const { state } = useJobsScraper();
  const starting = useMutationState({
    filters: { mutationKey: SCAN_KEY, status: "pending" },
  });
  const failedStart = useMutationState({
    filters: { mutationKey: SCAN_KEY },
    select: (mutation) => mutation.state.error,
  }).at(-1);

  return {
    error:
      failedStart ??
      (state?.scan.status === "FAILED"
        ? new Error(state.scan.error ?? "The job scan failed.")
        : null),
    isScanning: starting.length > 0 || state?.scan.status === "RUNNING",
  };
}
