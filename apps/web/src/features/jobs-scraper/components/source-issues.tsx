"use client";

import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { useState } from "react";
import type { JobSourceIssue } from "@/features/jobs-scraper/lib/types";

const DISMISSED_SCAN_KEY = "jobs-scraper:dismissed-source-issues";

// Dismissal is remembered per scan, so the next scan's issues show again.
export function SourceIssues({
  issues,
  scannedAt,
}: {
  issues: JobSourceIssue[];
  scannedAt: string | null;
}) {
  const [dismissedScan, setDismissedScan] = useState(() =>
    typeof window === "undefined"
      ? null
      : localStorage.getItem(DISMISSED_SCAN_KEY),
  );

  if (issues.length === 0 || (scannedAt && dismissedScan === scannedAt)) {
    return null;
  }

  function dismiss() {
    if (scannedAt) {
      localStorage.setItem(DISMISSED_SCAN_KEY, scannedAt);
    }
    setDismissedScan(scannedAt);
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Partial scan</p>
        <button
          type="button"
          className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/20"
          onClick={dismiss}
        >
          <XIcon className="size-4" />
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
