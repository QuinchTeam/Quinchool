"use client";

import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut";
import { InfoIcon } from "@phosphor-icons/react/dist/ssr/Info";
import { MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { RobotIcon } from "@phosphor-icons/react/dist/ssr/Robot";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { AppIcon } from "@/components/ui/icon";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SourceLogo } from "@/features/jobs-scraper/components/shared/source-logo";
import { useJobsScraper } from "@/features/jobs-scraper/hooks/use-jobs-scraper";
import { JOB_CLASSIFICATION_LABELS } from "@/features/jobs-scraper/lib/constants";
import {
  formatAge,
  formatDate,
  formatDateTime,
} from "@/features/jobs-scraper/lib/date";
import type { SavedJob } from "@/features/jobs-scraper/lib/types";

const QUINCHBOT_HEADINGS: Record<SavedJob["classification"], string> = {
  MATCH: "Summary",
  POTENTIAL: "Needs review",
  REJECTED: "Why it was rejected",
};

export function JobCard({
  footer,
  isGeneratingResume = false,
  job,
  onGenerateResume,
  resumeDisabled = false,
  showClassification = false,
}: {
  footer?: ReactNode;
  isGeneratingResume?: boolean;
  job: SavedJob;
  onGenerateResume?: () => void;
  resumeDisabled?: boolean;
  showClassification?: boolean;
}) {
  // matchedSkills is the job's whole stack as the model read it, not only your matches.
  const { state } = useJobsScraper();
  const requiredStack = new Set(
    state?.config.requiredTechnologies.map((tech) => tech.toLowerCase()),
  );
  // Matches first; toSorted is stable, so each group keeps the model's order.
  const stack = job.matchedSkills
    .map((skill) => ({
      isMatch: requiredStack.has(skill.toLowerCase()),
      skill,
    }))
    .toSorted((a, b) => Number(b.isMatch) - Number(a.isMatch));

  return (
    <Card>
      <CardContent className="grid gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {job.isNew ? <Badge>New</Badge> : null}
            {showClassification ? (
              <Badge
                variant={
                  job.classification === "REJECTED"
                    ? "destructive"
                    : "secondary"
                }
              >
                {JOB_CLASSIFICATION_LABELS[job.classification]}
              </Badge>
            ) : null}
            {job.isManualClassification ? (
              <Badge variant="outline">Set by you</Badge>
            ) : null}
            <Badge variant="secondary">{job.workMode}</Badge>
            <Badge variant="outline">{job.level}</Badge>
          </div>
          <SourceLogo source={job.source} />
        </div>

        <div className="grid gap-1">
          <h3 className="text-base font-semibold">{job.title}</h3>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{job.company}</span>
            <span className="flex items-center gap-1">
              <AppIcon icon={MapPinIcon} className="size-4 shrink-0" />
              {job.location}
            </span>
          </p>
        </div>

        {job.matchedSkills.length > 0 ? (
          <div className="grid gap-2">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              Stack
              <Tooltip>
                <TooltipTrigger
                  render={<button type="button" />}
                  aria-label="What the highlighted stack means"
                  className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <AppIcon icon={InfoIcon} className="size-4" />
                </TooltipTrigger>
                <TooltipContent>
                  Highlighted skills match your required stack.
                </TooltipContent>
              </Tooltip>
            </p>
            <div className="flex flex-wrap gap-2">
              {stack.map(({ isMatch, skill }) => (
                <Badge key={skill} variant={isMatch ? "default" : "outline"}>
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {/* Everything the model wrote lives here: the summary and its verdict reasons. */}
        <div className="grid gap-3 rounded-md border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">
              {QUINCHBOT_HEADINGS[job.classification]}
            </p>
            <p className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary">
              <AppIcon icon={RobotIcon} className="size-5" />
              Quinchbot AI
            </p>
          </div>
          <p className="text-sm leading-relaxed">{job.summary}</p>
          {job.reviewReasons.length > 0 ? (
            <ul className="ml-2 grid list-disc gap-1.5 pl-5 text-sm text-muted-foreground marker:text-primary">
              {job.reviewReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <JobDates job={job} />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          {footer ?? <span />}
          <div className="flex flex-wrap gap-2">
            {onGenerateResume ? (
              <Button
                type="button"
                disabled={resumeDisabled || isGeneratingResume}
                onClick={onGenerateResume}
              >
                <AppIcon icon={SparkleIcon} />
                {isGeneratingResume ? "Generating..." : "Generate Resume"}
              </Button>
            ) : null}
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              View job
              <AppIcon icon={ArrowSquareOutIcon} />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// The site's posted date next to our own dates shows staleness at a glance.
function JobDates({ job }: { job: SavedJob }) {
  const posted =
    job.postedAt ??
    (job.postedDate ? `${job.postedDate}T00:00:00+08:00` : null);

  return (
    <dl className="grid grid-cols-2 gap-3 rounded-md border p-3">
      <JobDate
        label={`Posted on ${job.source}`}
        value={
          posted ? (job.postedAt ? formatDateTime : formatDate)(posted) : null
        }
        age={posted ? formatAge(posted, !job.postedAt) : null}
      />
      <JobDate
        label="Added"
        value={formatDateTime(job.firstSeenAt)}
        age={formatAge(job.firstSeenAt)}
      />
    </dl>
  );
}

function JobDate({
  age,
  label,
  value,
}: {
  age: string | null;
  label: string;
  value: string | null;
}) {
  return (
    <div className="grid content-start gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value ?? "Unknown"}</dd>
      {age ? <dd className="text-xs text-muted-foreground">{age}</dd> : null}
    </div>
  );
}
