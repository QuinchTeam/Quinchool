"use client";

import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { useState } from "react";
import { AppIcon } from "@/components/ui/icon";
import type { JobSourceIssue } from "@/features/jobs-scraper/lib/types";

export function SourceIssues({ issues }: { issues: JobSourceIssue[] }) {
  // ponytail: dismissal lasts until reload; persist per scan if it nags.
  const [dismissed, setDismissed] = useState(false);

  if (issues.length === 0 || dismissed) {
    return null;
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Partial scan</p>
        <button
          type="button"
          className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/20"
          onClick={() => setDismissed(true)}
        >
          <AppIcon icon={XIcon} className="size-4" />
          <span className="sr-only">Dismiss</span>
        </button>
      </div>
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
