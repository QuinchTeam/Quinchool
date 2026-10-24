"use client";

import { Button } from "@/components/ui/button";
import { useJobsScraper } from "@/features/jobs-scraper/hooks/use-jobs-scraper";
import {
  JOB_CLASSIFICATION_LABELS,
  JOB_CLASSIFICATIONS,
} from "@/features/jobs-scraper/lib/constants";
import type { SavedJob } from "@/features/jobs-scraper/lib/types";

export function MoveJobActions({ job }: { job: SavedJob }) {
  const { updateClassification } = useJobsScraper();

  return (
    <div className="grid gap-2 border-t pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Move to</span>
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
            {JOB_CLASSIFICATION_LABELS[option]}
          </Button>
        ))}
      </div>
      {updateClassification.isError ? (
        <p className="text-sm text-destructive">
          The job could not be moved. Try again.
        </p>
      ) : null}
    </div>
  );
}
