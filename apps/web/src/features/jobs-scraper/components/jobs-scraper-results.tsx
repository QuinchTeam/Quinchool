"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { SlidersHorizontalIcon } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { JobResults } from "@/features/jobs-scraper/components/job-results";
import { JobCardSkeleton } from "@/features/jobs-scraper/components/shared/job-card-skeleton";
import {
  useJobsScraper,
  useLatestScan,
} from "@/features/jobs-scraper/hooks/use-jobs-scraper";
import { getUnsetScanCriteria } from "@/features/jobs-scraper/lib/criteria";

export function JobsScraperResults() {
  const { error, isLoading, refetch, scan, state } = useJobsScraper();
  const latestScan = useLatestScan();

  if (isLoading || latestScan.isPending) {
    return <LoadingResults />;
  }
  if (error) {
    return <ErrorState error={error} retry={() => void refetch()} />;
  }
  if (latestScan.error) {
    return <ErrorState error={latestScan.error} retry={() => scan.mutate()} />;
  }
  if (state?.lastScannedAt) {
    return <JobResults state={state} />;
  }

  const unsetCriteria = state ? getUnsetScanCriteria(state.config) : [];

  return (
    <div className="min-h-96">
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
