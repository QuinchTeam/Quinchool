import type { Metadata } from "next";

import { JobsScraperReviewPage } from "@/features/jobs-scraper/components/jobs-scraper-review-page";

export const metadata: Metadata = { title: "Jobs Scraper Review - Quinchool" };

export default function Page() {
  return <JobsScraperReviewPage />;
}
