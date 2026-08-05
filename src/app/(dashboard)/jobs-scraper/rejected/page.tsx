import type { Metadata } from "next";

import { JobReview } from "@/components/jobs-scraper/job-review";

export const metadata: Metadata = {
  title: "Review Scanned Jobs - Quinchool",
};

export default function JobsScraperRejectedPage() {
  return <JobReview />;
}
