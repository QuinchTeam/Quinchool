import type { Metadata } from "next";

import { JobScraperSettings } from "@/features/jobs-scraper/components/job-scraper-settings";

export const metadata: Metadata = {
  title: "Jobs Scraper Settings - Quinchool",
};

export default function JobsScraperSettingsPage() {
  return <JobScraperSettings />;
}
