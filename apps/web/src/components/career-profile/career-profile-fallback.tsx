"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Shown instead of a preview when the career profile failed to load or has
 * not been filled in yet. */
export function CareerProfileFallback({
  isError,
  onRetry,
}: {
  isError: boolean;
  onRetry: () => void;
}) {
  if (isError) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Could not load the career profile.
        </p>
        <Button type="button" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-2 border border-dashed p-6 text-center">
      <p className="font-medium">Your career profile is empty.</p>
      <Link
        className="text-sm text-primary underline underline-offset-4"
        href="/career-profile"
      >
        Add your career details
      </Link>
    </div>
  );
}
