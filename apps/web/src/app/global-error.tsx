"use client";

import { useEffect } from "react";
import {
  captureOperationError,
  pageDomain,
} from "@/lib/observability/operation";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(
    () =>
      captureOperationError(
        `${pageDomain(window.location.pathname)}.layout`,
        error,
      ),
    [error],
  );
  return (
    <html lang="en">
      <body>
        <h2>Something went wrong.</h2>
        <button type="button" onClick={unstable_retry}>
          Try again
        </button>
      </body>
    </html>
  );
}
