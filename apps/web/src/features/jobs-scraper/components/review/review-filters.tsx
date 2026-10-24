"use client";

import { Button } from "@/components/ui/button";
import { useJobsScraper } from "@/features/jobs-scraper/hooks/use-jobs-scraper";
import {
  REVIEW_FILTERS,
  useReviewFilter,
} from "@/features/jobs-scraper/hooks/use-review-filter";
import { JOB_CLASSIFICATION_LABELS } from "@/features/jobs-scraper/lib/constants";

export function ReviewFilters() {
  const { state } = useJobsScraper();
  const [filter, setFilter] = useReviewFilter();

  return (
    <div className="flex flex-wrap gap-2">
      {REVIEW_FILTERS.map((item) => (
        <Button
          key={item}
          size="sm"
          variant={filter === item ? "default" : "outline"}
          onClick={() => setFilter(item)}
        >
          {item === "ALL" ? "All" : JOB_CLASSIFICATION_LABELS[item]}
          <span className="text-xs opacity-70">
            {item === "ALL"
              ? (state?.savedJobCount ?? 0)
              : (state?.classificationCounts[item] ?? 0)}
          </span>
        </Button>
      ))}
    </div>
  );
}
