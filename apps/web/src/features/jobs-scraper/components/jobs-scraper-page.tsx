import { JobsScraperCriteria } from "@/features/jobs-scraper/components/jobs-scraper-criteria";
import { JobsScraperHeader } from "@/features/jobs-scraper/components/jobs-scraper-header";
import { JobsScraperResults } from "@/features/jobs-scraper/components/jobs-scraper-results";

export function JobsScraperPage() {
  return (
    <main className="min-h-full">
      <div className="px-6 pt-6">
        <JobsScraperHeader />
      </div>

      <div className="grid w-full gap-8 px-6 py-6 lg:grid-cols-4">
        <aside className="content-start lg:col-span-1">
          <JobsScraperCriteria />
        </aside>

        <section className="min-w-0 lg:col-span-3">
          <JobsScraperResults />
        </section>
      </div>
    </main>
  );
}
