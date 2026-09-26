import type { Metadata } from "next";

import { JobReview } from "@/features/jobs-scraper/components/job-review";

export const metadata: Metadata = {
  title: "Review Scanned Jobs - Quinchool",
};

export default function JobsScraperReviewPage() {
  return <JobReview />;
}
