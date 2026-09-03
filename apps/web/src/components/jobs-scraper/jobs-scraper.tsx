"use client";

import {
  AiSearch02Icon,
  AiSettingIcon,
  Briefcase01Icon,
  Calendar03Icon,
  Clock01Icon,
  FilterHorizontalIcon,
  RefreshIcon,
  Search01Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { JobCard } from "@/components/jobs-scraper/job-card";
import { Badge } from "@/components/ui/badge";
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
import { useCareerProfile } from "@/hooks/use-career-profile";
import { useJobsScraper } from "@/hooks/use-jobs-scraper";
import { useResumeBuilder } from "@/hooks/use-resume-builder";
import { DEFAULT_TEXT_GENERATION_MODEL_ID } from "@/lib/ai/text-generation/models";
import {
  getUnsetScanCriteria,
  type JobScraperConfig,
  type JobScraperState,
  type JobSourceIssue,
  type SavedJob,
} from "@/lib/jobs-scraper/schema";
import { applyTailoredResume } from "@/lib/resume";

export function JobsScraper() {
  const { isError, isLoading, refetch, scan, state } = useJobsScraper();
  const { careerProfile, isLoading: isProfileLoading } = useCareerProfile();
  const { buildResume } = useResumeBuilder(careerProfile);
  const [generatingJobId, setGeneratingJobId] = useState<string | null>(null);
  const unsetCriteria = state ? getUnsetScanCriteria(state.config) : [];

  async function generateResume(job: SavedJob) {
    if (!careerProfile) {
      toast.error("Add your career profile before generating a resume.");
      return;
    }

    setGeneratingJobId(job.id);

    try {
      const tailored = await buildResume.mutateAsync({
        jobId: job.id,
        modelId: DEFAULT_TEXT_GENERATION_MODEL_ID,
      });
      const { downloadResumePdf } = await import(
        "@/components/resume-builder/resume-pdf-preview"
      );
      await downloadResumePdf(applyTailoredResume(careerProfile, tailored));
      toast.success(`Resume tailored for ${job.title} downloaded.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Resume generation failed.",
      );
    } finally {
      setGeneratingJobId(null);
    }
  }

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
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
              {state ? formatTimeRange(state.config) : "Loading criteria"}
              {state && formatLocationModes(state.config) ? (
                <>
                  <span aria-hidden="true">/</span>
                  {formatLocationModes(state.config)}
                </>
              ) : null}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/jobs-scraper/rejected" />}
            >
              <HugeiconsIcon icon={Task01Icon} strokeWidth={2} />
              Review scan
              {state ? ` (${state.classificationCounts.REJECTED})` : ""}
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/jobs-scraper/settings" />}
            >
              <HugeiconsIcon icon={AiSettingIcon} strokeWidth={2} />
              Edit criteria
            </Button>
            <Button
              onClick={() => scan.mutate()}
              disabled={scan.isPending || !state || unsetCriteria.length > 0}
            >
              <HugeiconsIcon
                icon={state?.lastScannedAt ? RefreshIcon : Search01Icon}
                strokeWidth={2}
              />
              {scan.isPending
                ? "Scanning job boards"
                : state?.lastScannedAt
                  ? "Scan again"
                  : "Scan jobs"}
            </Button>
          </div>
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
          {state ? (
            <CriteriaSummary config={state.config} />
          ) : (
            <CriteriaLoading />
          )}
        </aside>

        <section className="min-w-0 lg:col-span-3">
          {isLoading || scan.isPending ? (
            <LoadingResults />
          ) : isError ? (
            <ErrorResults
              message="Saved jobs could not be loaded."
              onRetry={() => refetch()}
            />
          ) : scan.isError ? (
            <ErrorResults
              message={
                scan.error instanceof Error
                  ? scan.error.message
                  : "The job scan failed."
              }
              onRetry={() => scan.mutate()}
            />
          ) : state?.lastScannedAt ? (
            <JobResults
              state={state}
              generatingJobId={generatingJobId}
              resumeDisabled={isProfileLoading || buildResume.isPending}
              onGenerateResume={generateResume}
            />
          ) : (
            <Empty className="min-h-96 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon
                    icon={unsetCriteria.length > 0 ? AiSettingIcon : AiSearch02Icon}
                    strokeWidth={2}
                  />
                </EmptyMedia>
                <EmptyTitle>
                  {unsetCriteria.length > 0
                    ? "Set your criteria"
                    : "No scan yet"}
                </EmptyTitle>
                <EmptyDescription>
                  {unsetCriteria.length > 0
                    ? `Add ${unsetCriteria.join(", ")} to scan. Criteria are private to your account.`
                    : "Run a scan to save matching jobs to your account."}
                </EmptyDescription>
              </EmptyHeader>
              {unsetCriteria.length > 0 ? (
                <EmptyContent>
                  <Button
                    nativeButton={false}
                    render={<Link href="/jobs-scraper/settings" />}
                  >
                    Edit criteria
                  </Button>
                </EmptyContent>
              ) : null}
            </Empty>
          )}
        </section>
      </div>
    </main>
  );
}

function CriteriaSummary({ config }: { config: JobScraperConfig }) {
  return (
    <>
      <CriteriaGroup label="Roles" items={config.roles} />
      <CriteriaGroup label="Levels" items={config.includedLevels} />
      <CriteriaGroup
        label="Required stack"
        items={config.requiredTechnologies}
      />
      <CriteriaGroup
        label="Excluded levels"
        items={config.excludedLevels}
        destructive
      />
      <CriteriaGroup
        label="Excluded"
        items={config.excludedTechnologies}
        destructive
      />
      <div className="border-t pt-5">
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          Sources
        </p>
        <div className="flex flex-wrap gap-2">
          {config.sources.map((source) => (
            <Badge key={source} variant="outline">
              {source}
            </Badge>
          ))}
        </div>
      </div>
    </>
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
        {items.length > 0 ? (
          items.map((item) => (
            <Badge
              key={item}
              variant={destructive ? "destructive" : "secondary"}
            >
              {item}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        )}
      </div>
    </div>
  );
}

function JobResults({
  generatingJobId,
  onGenerateResume,
  resumeDisabled,
  state,
}: {
  generatingJobId: string | null;
  onGenerateResume: (job: SavedJob) => void;
  resumeDisabled: boolean;
  state: JobScraperState;
}) {
  const matches = state.jobs.filter((job) => job.classification === "MATCH");
  const potentialJobs = state.jobs.filter(
    (job) => job.classification === "POTENTIAL",
  );
  const scanTime = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(state.lastScannedAt ?? ""));

  if (matches.length === 0 && potentialJobs.length === 0) {
    return (
      <div className="grid gap-4">
        <SourceIssues issues={state.sourceIssues} />
        <Empty className="min-h-96 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>No saved jobs</EmptyTitle>
            <EmptyDescription>
              The latest scan did not find a listing that passed your criteria.
              {state.classificationCounts.REJECTED > 0
                ? ` ${state.classificationCounts.REJECTED} listings were rejected — review them to check the verdicts.`
                : ""}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/jobs-scraper/rejected" />}
            >
              Review rejected listings
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {matches.length + potentialJobs.length} saved{" "}
            {matches.length + potentialJobs.length === 1 ? "job" : "jobs"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {[...matches, ...potentialJobs].filter((job) => job.isNew).length}{" "}
            new in the latest scan / {state.classificationCounts.REJECTED}{" "}
            rejected
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
          Last scanned {scanTime}
        </p>
      </div>

      <SourceIssues issues={state.sourceIssues} />

      {matches.length > 0 ? (
        <JobSection
          title="Matches"
          jobs={matches}
          generatingJobId={generatingJobId}
          resumeDisabled={resumeDisabled}
          onGenerateResume={onGenerateResume}
        />
      ) : null}
      {potentialJobs.length > 0 ? (
        <JobSection
          title="Potential matches"
          description="Relevant listings with one or more details to review."
          jobs={potentialJobs}
          generatingJobId={generatingJobId}
          resumeDisabled={resumeDisabled}
          onGenerateResume={onGenerateResume}
        />
      ) : null}
    </div>
  );
}

function JobSection({
  description,
  generatingJobId,
  jobs,
  onGenerateResume,
  resumeDisabled,
  title,
}: {
  description?: string;
  generatingJobId: string | null;
  jobs: SavedJob[];
  onGenerateResume: (job: SavedJob) => void;
  resumeDisabled: boolean;
  title: string;
}) {
  return (
    <section className="grid gap-3">
      <div>
        <h2 className="text-base font-semibold">
          {title} <span className="text-muted-foreground">{jobs.length}</span>
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="divide-y overflow-hidden rounded-lg border bg-background">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            isGeneratingResume={generatingJobId === job.id}
            resumeDisabled={resumeDisabled}
            onGenerateResume={() => onGenerateResume(job)}
          />
        ))}
      </div>
    </section>
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

function CriteriaLoading() {
  return (
    <div className="grid gap-5">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="grid gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-full" />
        </div>
      ))}
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
      <div className="overflow-hidden rounded-lg border bg-background">
        {[0, 1, 2].map((item) => (
          <div key={item} className="grid gap-4 border-b p-6 last:border-b-0">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-5 w-3/4" />
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
        <EmptyTitle>Jobs unavailable</EmptyTitle>
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

function formatTimeRange(config: JobScraperConfig): string {
  if (config.timeRange === "LAST_HOUR") return "Last hour";
  if (config.timeRange === "TODAY") return "Today only";
  if (config.timeRange === "THIS_WEEK") return "This week";
  return `${config.customStartDate ?? "Custom"} to ${config.customEndDate ?? "range"}`;
}

function formatLocationModes(config: JobScraperConfig): string {
  const worldwide = config.worldwideWorkModes.join(", ");
  const philippines = config.philippinesWorkModes.join(", ");
  return [
    worldwide ? `Worldwide: ${worldwide}` : "",
    philippines ? `Philippines: ${philippines}` : "",
  ]
    .filter(Boolean)
    .join(" / ");
}
