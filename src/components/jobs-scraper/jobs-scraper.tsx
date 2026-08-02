"use client";

import {
  AiSearch02Icon,
  Briefcase01Icon,
  Calendar03Icon,
  Clock01Icon,
  FilterHorizontalIcon,
  Location01Icon,
  RefreshIcon,
  Search01Icon,
  SquareArrowUpRightIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type DiscoveredJob,
  EXCLUDED_JOB_LEVELS,
  EXCLUDED_TECH,
  JOB_LEVELS,
  JOB_ROLES,
  JOB_SOURCES,
  type JobScanResult,
  type JobSourceIssue,
  type PotentialJob,
  REQUIRED_TECH,
} from "@/lib/jobs-scraper/schema";
import { cn } from "@/lib/utils";

async function requestJobScan(): Promise<JobScanResult> {
  const response = await fetch("/api/jobs-scraper", { method: "POST" });
  const body = (await response.json()) as JobScanResult | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in body && body.error ? body.error : "The job scan failed.",
    );
  }

  return body as JobScanResult;
}

export function JobsScraper() {
  const scan = useMutation({ mutationFn: requestJobScan });

  return (
    <main className="min-h-full bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                icon={Briefcase01Icon}
                strokeWidth={2}
                className="size-6 text-primary"
              />
              <h1 className="text-2xl font-semibold">Jobs Scraper</h1>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
              Today only <span aria-hidden="true">·</span> Remote worldwide
              <span aria-hidden="true">·</span> Hybrid in the Philippines
            </p>
          </div>
          <Button
            onClick={() => scan.mutate()}
            disabled={scan.isPending}
            className="w-full sm:w-auto"
          >
            <HugeiconsIcon
              icon={scan.data ? RefreshIcon : Search01Icon}
              strokeWidth={2}
            />
            {scan.isPending
              ? "Scanning job boards"
              : scan.data
                ? "Scan again"
                : "Scan today's jobs"}
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-4">
        <aside className="grid content-start gap-6 lg:col-span-1">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={FilterHorizontalIcon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
            <h2 className="text-sm font-semibold">Search criteria</h2>
          </div>
          <CriteriaGroup label="Roles" items={JOB_ROLES} />
          <CriteriaGroup label="Levels" items={JOB_LEVELS} />
          <CriteriaGroup label="Required stack" items={REQUIRED_TECH} />
          <CriteriaGroup
            label="Excluded levels"
            items={EXCLUDED_JOB_LEVELS}
            destructive
          />
          <CriteriaGroup label="Excluded" items={EXCLUDED_TECH} destructive />
          <div className="border-t pt-5">
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {JOB_SOURCES.map((source) => (
                <Badge key={source} variant="outline">
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        </aside>

        <section className="min-w-0 lg:col-span-3">
          {scan.isPending ? (
            <LoadingResults />
          ) : scan.isError ? (
            <ErrorResults
              message={
                scan.error instanceof Error
                  ? scan.error.message
                  : "The job scan failed."
              }
              onRetry={() => scan.mutate()}
            />
          ) : scan.data ? (
            <JobResults result={scan.data} />
          ) : (
            <Empty className="min-h-96 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={AiSearch02Icon} strokeWidth={2} />
                </EmptyMedia>
                <EmptyTitle>No scan yet</EmptyTitle>
                <EmptyDescription>
                  Run a scan to see listings that pass every active filter.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>
      </div>
    </main>
  );
}

function CriteriaGroup({
  destructive = false,
  items,
  label,
}: {
  destructive?: boolean;
  items: readonly string[];
  label: string;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant={destructive ? "destructive" : "secondary"}>
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function JobResults({ result }: { result: JobScanResult }) {
  const potentialJobs = result.potentialJobs ?? [];
  const scanTime = new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(result.scannedAt));

  if (result.jobs.length === 0 && potentialJobs.length === 0) {
    return (
      <div className="grid gap-4">
        <SourceIssues issues={result.sourceIssues ?? []} />
        <Empty className="min-h-96 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>No matches today</EmptyTitle>
            <EmptyDescription>
              No source listing passed every title, stack, location, and
              exclusion filter.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {result.jobs.length}{" "}
            {result.jobs.length === 1 ? "match" : "matches"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Posted {formatScanDate(result.scanDate)}
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
          Scanned at {scanTime}
        </p>
      </div>

      <SourceIssues issues={result.sourceIssues ?? []} />

      {result.jobs.length > 0 ? (
        <JobList jobs={result.jobs} scanDate={result.scanDate} />
      ) : null}

      {potentialJobs.length > 0 ? (
        <section className="grid gap-3 pt-4">
          <div>
            <h2 className="text-base font-semibold">
              {potentialJobs.length} potential{" "}
              {potentialJobs.length === 1 ? "match" : "matches"}
            </h2>
            <p className="text-sm text-muted-foreground">
              These are relevant listings with details that need manual review.
            </p>
          </div>
          <JobList jobs={potentialJobs} scanDate={result.scanDate} />
        </section>
      ) : null}
    </div>
  );
}

function JobList({
  jobs,
  scanDate,
}: {
  jobs: (DiscoveredJob | PotentialJob)[];
  scanDate: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      {jobs.map((job) => (
        <JobCard key={job.url} job={job} scanDate={scanDate} />
      ))}
    </div>
  );
}

function JobCard({
  job,
  scanDate,
}: {
  job: DiscoveredJob | PotentialJob;
  scanDate: string;
}) {
  const isPotential = "reviewReasons" in job;

  return (
    <article className="grid gap-4 border-b p-5 last:border-b-0 sm:p-6 md:grid-cols-4">
      <div className="grid min-w-0 gap-3 md:col-span-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{job.source}</Badge>
          <Badge variant="secondary">{job.workMode}</Badge>
          <Badge variant="outline">
            {job.postedDate === scanDate ? "Today" : "Date unconfirmed"}
          </Badge>
        </div>
        <div>
          <h3 className="text-base font-semibold">{job.title}</h3>
          <p className="text-sm text-muted-foreground">{job.company}</p>
        </div>
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <HugeiconsIcon
            icon={Location01Icon}
            className="mt-0.5 size-4 shrink-0"
          />
          {job.location}
        </p>
        <p className="text-sm leading-relaxed">{job.summary}</p>
        {job.matchedSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {job.matchedSkills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        ) : null}
        {isPotential ? (
          <ul className="grid gap-1 text-sm text-muted-foreground">
            {job.reviewReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="flex items-start md:justify-end">
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full md:w-auto",
          )}
        >
          View job
          <HugeiconsIcon icon={SquareArrowUpRightIcon} strokeWidth={2} />
        </a>
      </div>
    </article>
  );
}

function SourceIssues({ issues }: { issues: JobSourceIssue[] }) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <p className="mb-2 text-sm font-medium">Partial scan</p>
      <ul className="grid gap-1 text-sm text-muted-foreground">
        {issues.map((issue) => (
          <li key={issue.source}>
            <span className="font-medium text-foreground">{issue.source}:</span>{" "}
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoadingResults() {
  return (
    <output className="grid gap-4" aria-busy="true" aria-label="Scanning jobs">
      <div className="flex items-end justify-between">
        <div className="grid gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="overflow-hidden rounded-lg border bg-background">
        {[0, 1, 2].map((item) => (
          <div key={item} className="grid gap-4 border-b p-6 last:border-b-0">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    </output>
  );
}

function ErrorResults({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Empty className="min-h-96 border border-destructive/30">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="text-destructive">
          <HugeiconsIcon icon={AiSearch02Icon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>Scan failed</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={onRetry}>
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function formatScanDate(date: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    day: "numeric",
    month: "long",
    timeZone: "Asia/Manila",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00+08:00`));
}
