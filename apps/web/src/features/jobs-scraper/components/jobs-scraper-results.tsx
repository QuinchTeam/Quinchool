"use client";

import { BriefcaseIcon } from "@phosphor-icons/react/dist/ssr/Briefcase";
import { ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { ListChecksIcon } from "@phosphor-icons/react/dist/ssr/ListChecks";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { SlidersHorizontalIcon } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppIcon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useCareerProfile } from "@/features/career-profile/hooks/use-career-profile";
import { JobCard } from "@/features/jobs-scraper/components/job-card";
import {
  useJobsScraper,
  useLatestScan,
} from "@/features/jobs-scraper/hooks/use-jobs-scraper";
import {
  getUnsetScanCriteria,
  type JobScraperState,
  type JobSourceIssue,
  type SavedJob,
} from "@/features/jobs-scraper/lib/schema";
import { useResumeBuilder } from "@/features/resume-builder/hooks/use-resume-builder";
import { applyTailoredResume } from "@/features/resume-builder/lib/resume";
import { DEFAULT_TEXT_GENERATION_MODEL_ID } from "@/lib/ai/text-generation/models";

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

function JobResults({ state }: { state: JobScraperState }) {
  const { careerProfile, isLoading: isProfileLoading } = useCareerProfile();
  const { buildResume } = useResumeBuilder(careerProfile);
  const [generatingJobId, setGeneratingJobId] = useState<string | null>(null);
  const resumeDisabled = isProfileLoading || buildResume.isPending;

  const matches = state.jobs.filter((job) => job.classification === "MATCH");
  const potentialJobs = state.jobs.filter(
    (job) => job.classification === "POTENTIAL",
  );
  const scanTime = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(state.lastScannedAt ?? ""));

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
      const { downloadResumePdf } =
        await import("@/features/resume-builder/components/resume-pdf-preview");
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

  if (matches.length === 0 && potentialJobs.length === 0) {
    return (
      <div className="grid gap-4">
        <SourceIssues issues={state.sourceIssues} />
        <div className="min-h-96">
          <EmptyState
            icon={BriefcaseIcon}
            title="No Saved Jobs"
            description={`The latest scan did not find a listing that passed your criteria.${
              state.classificationCounts.REJECTED > 0
                ? ` ${state.classificationCounts.REJECTED} listings were rejected — review them to check the verdicts.`
                : ""
            }`}
            action={
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href="/jobs-scraper/review" />}
              >
                <AppIcon icon={ListChecksIcon} />
                Review scanned jobs
              </Button>
            }
          />
        </div>
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
          <AppIcon icon={ClockIcon} className="size-3.5" />
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
          onGenerateResume={generateResume}
        />
      ) : null}
      {potentialJobs.length > 0 ? (
        <JobSection
          title="Potential matches"
          description="Relevant listings with one or more details to review."
          jobs={potentialJobs}
          generatingJobId={generatingJobId}
          resumeDisabled={resumeDisabled}
          onGenerateResume={generateResume}
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
      <div className="grid gap-4">
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
      </div>
    </output>
  );
}
