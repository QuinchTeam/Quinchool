import { JobCard } from "@/features/jobs-scraper/components/shared/job-card";
import { useGenerateResume } from "@/features/jobs-scraper/hooks/use-generate-resume";
import type { SavedJob } from "@/features/jobs-scraper/lib/types";

export function JobSection({
  description,
  jobs,
  title,
}: {
  description?: string;
  jobs: SavedJob[];
  title: string;
}) {
  const { generateResume, generatingJobId, resumeDisabled } =
    useGenerateResume();

  return (
    <section className="grid gap-3">
      <div>
        <h2 className="text-base font-semibold">
          {title} <span className="text-muted-foreground">{jobs.length}</span>
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-4">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            isGeneratingResume={generatingJobId === job.id}
            resumeDisabled={resumeDisabled}
            onGenerateResume={() => generateResume(job)}
          />
        ))}
      </div>
    </section>
  );
}
