"use client";

import { PlusCircleIcon } from "@phosphor-icons/react/dist/ssr/PlusCircle";
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/icon";

/** Shown instead of a preview when the career profile failed to load or has
 * not been filled in yet. */
export function CareerProfileFallback({
  error,
  retry,
}: {
  error: Error | null;
  retry: () => void;
}) {
  if (error) return <ErrorState error={error} retry={retry} />;

  return (
    <EmptyState
      icon={IdentificationCardIcon}
      title="Your Career Profile Is Empty"
      description="Add your experience, education, and skills to build and tailor resumes."
      action={
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/career-profile" />}
        >
          <AppIcon icon={PlusCircleIcon} />
          Add career details
        </Button>
      }
    />
  );
}
