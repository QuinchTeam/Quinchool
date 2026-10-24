import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { ListChecksIcon } from "@phosphor-icons/react/dist/ssr/ListChecks";
import Link from "next/link";

import { AppHeader } from "@/components/shared/app-header";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/icon";
import { ReviewFilters } from "@/features/jobs-scraper/components/review/review-filters";
import { ReviewJobList } from "@/features/jobs-scraper/components/review/review-job-list";

export function JobsScraperReviewPage() {
  return (
    <main className="min-h-full">
      <div className="px-6 pt-6">
        <AppHeader
          icon={ListChecksIcon}
          title="Review Scan Results"
          description="Every listing the crawler read, with the verdict the scan gave it. Move anything the scan got wrong — your choice sticks and later scans will not overwrite it."
        >
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/jobs-scraper" />}
          >
            <AppIcon icon={CaretLeftIcon} />
            Back to jobs
          </Button>
        </AppHeader>
      </div>

      <div className="grid w-full gap-6 px-6 py-6">
        <ReviewFilters />
        <ReviewJobList />
      </div>
    </main>
  );
}
