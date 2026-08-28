"use client";

import {
  ArrowLeft01Icon,
  Briefcase01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";

import {
  CLASSIFICATION_LABELS,
  JobCard,
} from "@/components/jobs-scraper/job-card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobsScraper } from "@/hooks/use-jobs-scraper";
import { JOB_CLASSIFICATIONS, type SavedJob } from "@/lib/jobs-scraper/schema";

type Filter = SavedJob["classification"] | "ALL";

const FILTERS: Filter[] = ["REJECTED", "POTENTIAL", "MATCH", "ALL"];

export function JobReview() {
  const { isError, isLoading, refetch, state, updateClassification } =
    useJobsScraper();
  const [filter, setFilter] = useState<Filter>("REJECTED");
  const jobs =
    state?.jobs.filter(
      (job) => filter === "ALL" || job.classification === filter,
    ) ?? [];

  return (
    <main className="min-h-full bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-2">
            <Link
              href="/jobs-scraper"
              className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
              Back to jobs
            </Link>
            <h1 className="text-2xl font-semibold">Review scan results</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Every listing the crawler read, with the verdict the scan gave it.
              Move anything the scan got wrong — your choice sticks and later
              scans will not overwrite it.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6">
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
        ) : isError ? (
          <Empty className="min-h-96 border border-destructive/30">
            <EmptyHeader>
              <EmptyTitle>Jobs unavailable</EmptyTitle>
              <EmptyDescription>
                Saved jobs could not be loaded.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={() => refetch()}>
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
                Try again
              </Button>
            </EmptyContent>
          </Empty>
        ) : jobs.length === 0 ? (
          <Empty className="min-h-96 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>Nothing here</EmptyTitle>
              <EmptyDescription>
                No scanned job carries this verdict yet.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="overflow-hidden rounded-lg border bg-background"
              >
                <JobCard
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
              </div>
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
        <div
          key={item}
          className="grid gap-4 rounded-lg border bg-background p-6"
        >
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </output>
  );
}
