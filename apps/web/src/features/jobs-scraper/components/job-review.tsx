"use client";

import { AppHeader } from "@/components/shared/app-header";
import { BriefcaseIcon } from "@phosphor-icons/react/dist/ssr/Briefcase";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { AppIcon } from "@/components/ui/icon";
import Link from "next/link";
import { useState } from "react";

import {
  CLASSIFICATION_LABELS,
  JobCard,
} from "@/features/jobs-scraper/components/job-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobsScraper } from "@/features/jobs-scraper/hooks/use-jobs-scraper";
import {
  JOB_CLASSIFICATIONS,
  type SavedJob,
} from "@/features/jobs-scraper/lib/schema";

type Filter = SavedJob["classification"] | "ALL";

const FILTERS: Filter[] = ["REJECTED", "POTENTIAL", "MATCH", "ALL"];

export function JobReview() {
  const { error, isLoading, refetch, state, updateClassification } =
    useJobsScraper();
  const [filter, setFilter] = useState<Filter>("REJECTED");
  const jobs =
    state?.jobs.filter(
      (job) => filter === "ALL" || job.classification === filter,
    ) ?? [];

  return (
    <main className="min-h-full">
      <div className="px-6 pt-6">
        <AppHeader
          title="Review Scan Results"
          description="Every listing the crawler read, with the verdict the scan gave it. Move anything the scan got wrong — your choice sticks and later scans will not overwrite it."
        >
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/jobs-scraper" />}
          >
            <AppIcon icon={CaretLeftIcon} />
            Back to jobs
          </Button>
        </AppHeader>
      </div>

      <div className="grid w-full gap-6 px-6 py-6">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={filter === item ? "default" : "outline"}
              onClick={() => setFilter(item)}
            >
              {item === "ALL" ? "All" : CLASSIFICATION_LABELS[item]}
              <span className="text-xs opacity-70">
                {item === "ALL"
                  ? (state?.savedJobCount ?? 0)
                  : (state?.classificationCounts[item] ?? 0)}
              </span>
            </Button>
          ))}
        </div>

        {updateClassification.isError ? (
          <p className="text-sm text-destructive">
            The job could not be moved. Try again.
          </p>
        ) : null}

        {isLoading ? (
          <ReviewLoading />
        ) : error ? (
          <ErrorState error={error} retry={() => void refetch()} />
        ) : jobs.length === 0 ? (
          <div className="min-h-96">
            <EmptyState
              icon={BriefcaseIcon}
              title="Nothing Here"
              description="No scanned job carries this verdict yet."
            />
          </div>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                showClassification
                footer={
                  <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                      Move to
                    </span>
                    {JOB_CLASSIFICATIONS.filter(
                      (option) => option !== job.classification,
                    ).map((option) => (
                      <Button
                        key={option}
                        size="sm"
                        variant="outline"
                        disabled={updateClassification.isPending}
                        onClick={() =>
                          updateClassification.mutate({
                            classification: option,
                            id: job.id,
                          })
                        }
                      >
                        {CLASSIFICATION_LABELS[option]}
                      </Button>
                    ))}
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
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
