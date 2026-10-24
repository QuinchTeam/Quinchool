import { JobCard } from "@/features/jobs-scraper/components/shared/job-card";
import type { SavedJob } from "@/features/jobs-scraper/lib/types";

export function JobSection({
  description,
  generatingJobId,
  jobs,
  onGenerateResume,
  resumeDisabled,
  title,
}: {
  description?: string;
  generatingJobId: string | null;
  jobs: SavedJob[];
  onGenerateResume: (job: SavedJob) => void;
  resumeDisabled: boolean;
  title: string;
}) {
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
            onGenerateResume={() => onGenerateResume(job)}
          />
        ))}
      </div>
    </section>
  );
}
