"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  captureOperationError,
  pageDomain,
} from "@/lib/observability/operation";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(
    () =>
      captureOperationError(
        `${pageDomain(window.location.pathname)}.render`,
        error,
      ),
    [error],
  );
  return (
    <div
      role="alert"
      className="flex min-h-64 flex-col items-center justify-center gap-4"
    >
      <h2>Something went wrong.</h2>
      <Button onClick={unstable_retry}>Try again</Button>
    </div>
  );
}
