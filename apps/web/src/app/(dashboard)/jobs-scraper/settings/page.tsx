import type { Metadata } from "next";

import { JobsScraperSettingsPage } from "@/features/jobs-scraper/components/settings/jobs-scraper-settings-page";

export const metadata: Metadata = {
  title: "Jobs Scraper Settings - Quinchool",
};

export default function Page() {
  return <JobsScraperSettingsPage />;
}
