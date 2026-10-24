import "server-only";

import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/icon";
import {
  DashboardPanel,
  DashboardPanelSkeleton,
} from "@/features/dashboard/components/dashboard-panel";
import { loadJobs } from "@/features/dashboard/lib/load";

export function NewJobMatches() {
  return (
    <Suspense
      fallback={<DashboardPanelSkeleton label="Loading new job matches" />}
    >
      <JobMatchesPanel />
    </Suspense>
  );
}

async function JobMatchesPanel() {
  const jobs = await loadJobs();
  const newJobs = jobs?.jobs.filter((job) => job.isNew).slice(0, 5) ?? [];

  return (
    <DashboardPanel
      title="New job matches"
      footerHref="/jobs-scraper/review"
      footerLabel="View more jobs"
    >
      {newJobs.length ? (
        newJobs.map((job) => (
          <div key={job.id} className="grid min-w-0 gap-0.5">
            <p className="truncate text-sm font-medium">{job.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {job.company} · {job.location}
            </p>
          </div>
        ))
      ) : (
        <EmptyState
          icon={MagnifyingGlassIcon}
          title="No New Matches"
          description="Run a scan to find jobs that fit your criteria."
          action={
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/jobs-scraper" />}
            >
              <AppIcon icon={MagnifyingGlassIcon} />
              Run a scan
            </Button>
          }
        />
      )}
    </DashboardPanel>
  );
}
