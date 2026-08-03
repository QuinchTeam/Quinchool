import type { Metadata } from "next";

import { JobScraperSettings } from "@/components/jobs-scraper/job-scraper-settings";

export const metadata: Metadata = {
  title: "Jobs Scraper Settings - Quinchool",
};

export default function JobsScraperSettingsPage() {
  return <JobScraperSettings />;
}
