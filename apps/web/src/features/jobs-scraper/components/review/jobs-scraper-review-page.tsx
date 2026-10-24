import { ReviewFilters } from "@/features/jobs-scraper/components/review/review-filters";
import { ReviewHeader } from "@/features/jobs-scraper/components/review/review-header";
import { ReviewJobList } from "@/features/jobs-scraper/components/review/review-job-list";

export function JobsScraperReviewPage() {
  return (
    <main className="min-h-full">
      <div className="px-6 pt-6">
        <ReviewHeader />
      </div>

      <div className="grid w-full gap-6 px-6 py-6">
        <ReviewFilters />
        <ReviewJobList />
      </div>
    </main>
  );
}
