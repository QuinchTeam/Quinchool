"use client";

import { BriefcaseIcon } from "@phosphor-icons/react/dist/ssr/Briefcase";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard } from "@/features/jobs-scraper/components/job-card";
import { MoveJobActions } from "@/features/jobs-scraper/components/review/move-job-actions";
import { useJobsScraper } from "@/features/jobs-scraper/hooks/use-jobs-scraper";
import { useReviewFilter } from "@/features/jobs-scraper/hooks/use-review-filter";

export function ReviewJobList() {
  const { error, isLoading, refetch, state } = useJobsScraper();
  const [filter] = useReviewFilter();
  const jobs =
    state?.jobs.filter(
      (job) => filter === "ALL" || job.classification === filter,
    ) ?? [];

  if (isLoading) {
    return <ReviewLoading />;
  }
  if (error) {
    return <ErrorState error={error} retry={() => void refetch()} />;
  }
  if (jobs.length === 0) {
    return (
      <div className="min-h-96">
        <EmptyState
          icon={BriefcaseIcon}
          title="Nothing Here"
          description="No scanned job carries this verdict yet."
        />
      </div>
    );
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          showClassification
          footer={<MoveJobActions job={job} />}
        />
      ))}
    </div>
  );
}

function ReviewLoading() {
  return (
    <output
      className="grid items-start gap-4 lg:grid-cols-2"
      aria-busy="true"
      aria-label="Loading scanned jobs"
    >
      {[0, 1, 2, 3].map((item) => (
        <Card key={item}>
          <CardContent className="grid gap-4">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </output>
  );
}
