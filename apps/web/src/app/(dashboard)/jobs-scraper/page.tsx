import type { Metadata } from "next";

import { JobsScraperPage } from "@/features/jobs-scraper/components/jobs-scraper-page";

export const metadata: Metadata = { title: "Jobs Scraper - Quinchool" };

export default function Page() {
  return <JobsScraperPage />;
}
