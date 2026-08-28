"use client";

import {
  Location01Icon,
  SquareArrowUpRightIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { SavedJob } from "@/lib/jobs-scraper/schema";
import { cn } from "@/lib/utils";

export function JobCard({
  footer,
  job,
  showClassification = false,
}: {
  footer?: ReactNode;
  job: SavedJob;
  showClassification?: boolean;
}) {
  return (
    <article className="grid gap-4 p-5 sm:p-6 md:grid-cols-4">
      <div className="grid min-w-0 gap-3 md:col-span-3">
        <div className="flex flex-wrap items-center gap-2">
          {job.isNew ? <Badge>New</Badge> : null}
          {showClassification ? (
            <Badge
              variant={
                job.classification === "REJECTED" ? "destructive" : "secondary"
              }
            >
              {CLASSIFICATION_LABELS[job.classification]}
            </Badge>
          ) : null}
          {job.isManualClassification ? (
            <Badge variant="outline">Set by you</Badge>
          ) : null}
          <Badge variant="outline">{job.source}</Badge>
          <Badge variant="secondary">{job.workMode}</Badge>
          <Badge variant="outline">{job.level}</Badge>
          <Badge variant="outline">
            {job.postedText ?? formatPostedDate(job.postedDate)}
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
        {job.reviewReasons.length > 0 ? (
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              {job.classification === "REJECTED"
                ? "Why it was rejected"
                : "Needs review"}
            </p>
            <ul className="grid list-disc gap-1 pl-4 text-sm text-muted-foreground">
              {job.reviewReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Last seen {formatDateTime(job.lastSeenAt)}
        </p>
        {footer}
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

export const CLASSIFICATION_LABELS: Record<SavedJob["classification"], string> =
  {
    MATCH: "Match",
    POTENTIAL: "Potential",
    REJECTED: "Rejected",
  };

export function formatPostedDate(date: string | null): string {
  if (!date) return "Date unconfirmed";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(`${date}T00:00:00+08:00`));
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(date));
}
