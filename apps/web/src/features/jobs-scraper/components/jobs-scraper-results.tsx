"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { SlidersHorizontalIcon } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { JobResults } from "@/features/jobs-scraper/components/job-results";
import { ScanProgressCard } from "@/features/jobs-scraper/components/scan-progress-card";
import { JobCardSkeleton } from "@/features/jobs-scraper/components/shared/job-card-skeleton";
import {
  useJobsScraper,
  useScanStatus,
} from "@/features/jobs-scraper/hooks/use-jobs-scraper";
import { getUnsetScanCriteria } from "@/features/jobs-scraper/lib/criteria";

export function JobsScraperResults() {
  const { error, isLoading, refetch, scan, state } = useJobsScraper();
  const { error: scanError, isScanning } = useScanStatus();
  const status = state?.scan.status;
  const previousStatus = useRef(status);

  // Toast only on a RUNNING -> IDLE change seen by polling, never on a plain page load.
  useEffect(() => {
    if (previousStatus.current === "RUNNING" && status === "IDLE") {
      const count = state?.newJobCount ?? 0;
      toast.success("Scan complete", {
        description:
          count === 0
            ? "No new jobs this time."
            : `${count} new ${count === 1 ? "job" : "jobs"} found.`,
      });
    }
    previousStatus.current = status;
  }, [status, state?.newJobCount]);

  if (isLoading) {
    return <LoadingResults />;
  }
  if (error) {
    return <ErrorState error={error} retry={() => void refetch()} />;
  }

  // Earlier results stay visible while a rescan runs or after one fails.
  const banner =
    isScanning && state ? (
      <ScanProgressCard state={state} />
    ) : scanError ? (
      <ErrorState error={scanError} retry={() => scan.mutate()} />
    ) : null;

  if (isScanning && !state?.lastScannedAt) {
    return banner;
  }
  if (state?.lastScannedAt) {
    return (
      <div className="grid gap-6">
        {banner}
        <JobResults state={state} />
      </div>
    );
  }

  const unsetCriteria = state ? getUnsetScanCriteria(state.config) : [];

  return (
    <div className="grid min-h-96 gap-6">
      {banner}
      <EmptyState
        icon={
          unsetCriteria.length > 0 ? SlidersHorizontalIcon : MagnifyingGlassIcon
        }
        title={unsetCriteria.length > 0 ? "Set Your Criteria" : "No Scan Yet"}
        description={
          unsetCriteria.length > 0
            ? `Add ${unsetCriteria.join(", ")} to scan. Criteria are private to your account.`
            : "Run a scan to save matching jobs to your account."
        }
        action={
          unsetCriteria.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/jobs-scraper/settings" />}
            >
              <AppIcon icon={SlidersHorizontalIcon} />
              Edit criteria
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

function LoadingResults() {
  return (
    <output className="grid gap-4" aria-busy="true" aria-label="Loading jobs">
      <div className="flex items-end justify-between">
        <div className="grid gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-4">
        {[0, 1, 2].map((item) => (
          <JobCardSkeleton key={item} />
        ))}
      </div>
    </output>
  );
}
