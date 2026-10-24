import type { Metadata } from "next";
import { Suspense } from "react";

import { JobsScraperReviewPage } from "@/features/jobs-scraper/components/review/jobs-scraper-review-page";

export const metadata: Metadata = { title: "Jobs Scraper Review - Quinchool" };

export default function Page() {
  return (
    <Suspense>
      <JobsScraperReviewPage />
    </Suspense>
  );
}
