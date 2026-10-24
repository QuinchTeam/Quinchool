"use client";

import { BriefcaseIcon } from "@phosphor-icons/react/dist/ssr/Briefcase";
import { ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { ListChecksIcon } from "@phosphor-icons/react/dist/ssr/ListChecks";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/icon";
import { useCareerProfile } from "@/features/career-profile/hooks/use-career-profile";
import { JobSection } from "@/features/jobs-scraper/components/job-section";
import { SourceIssues } from "@/features/jobs-scraper/components/source-issues";
import { formatDateTime } from "@/features/jobs-scraper/lib/date";
import type {
  JobScraperState,
  SavedJob,
} from "@/features/jobs-scraper/lib/types";
import { useResumeBuilder } from "@/features/resume-builder/hooks/use-resume-builder";
import { applyTailoredResume } from "@/features/resume-builder/lib/resume";
import { DEFAULT_TEXT_GENERATION_MODEL_ID } from "@/lib/ai/text-generation/models";

export function JobResults({ state }: { state: JobScraperState }) {
  const { careerProfile, isLoading: isProfileLoading } = useCareerProfile();
  const { buildResume } = useResumeBuilder(careerProfile);
  const [generatingJobId, setGeneratingJobId] = useState<string | null>(null);
  const resumeDisabled = isProfileLoading || buildResume.isPending;

  const matches = state.jobs.filter((job) => job.classification === "MATCH");
  const potentialJobs = state.jobs.filter(
    (job) => job.classification === "POTENTIAL",
  );
  const savedJobs = [...matches, ...potentialJobs];

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
        await import("@/features/resume-builder/lib/resume-pdf");
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

  if (savedJobs.length === 0) {
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
            {savedJobs.length} saved {savedJobs.length === 1 ? "job" : "jobs"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {savedJobs.filter((job) => job.isNew).length} new in the latest scan
            / {state.classificationCounts.REJECTED} rejected
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <AppIcon icon={ClockIcon} className="size-3.5" />
          Last scanned {formatDateTime(state.lastScannedAt ?? "")}
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
