"use client";

import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowClockwise";
import { HouseIcon } from "@phosphor-icons/react/dist/ssr/House";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AppIcon } from "@/components/ui/icon";
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
    <main
      role="alert"
      className="flex min-h-svh w-full items-center justify-center p-6"
    >
      <Empty className="max-w-md border border-dashed border-destructive/30 bg-destructive/5">
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="bg-destructive/10 text-destructive"
          >
            <AppIcon icon={WarningCircleIcon} />
          </EmptyMedia>
          <EmptyTitle>Something Went Wrong</EmptyTitle>
          <EmptyDescription>
            This page hit an unexpected error. Try again, or head back home.
          </EmptyDescription>
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground">
              Ref: {error.digest}
            </p>
          )}
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center">
          <Button onClick={unstable_retry}>
            <AppIcon icon={ArrowClockwiseIcon} />
            Try again
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <AppIcon icon={HouseIcon} />
            Home
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
