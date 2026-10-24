import type { JobSourceIssue } from "@/features/jobs-scraper/lib/types";

export function SourceIssues({ issues }: { issues: JobSourceIssue[] }) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <p className="mb-2 text-sm font-medium">Partial scan</p>
      <ul className="grid gap-1 text-sm text-muted-foreground">
        {issues.map((issue) => (
          <li key={issue.source}>
            <span className="font-medium text-foreground">{issue.source}:</span>{" "}
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
