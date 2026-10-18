"use client";

import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowClockwise";
import { LockKeyIcon } from "@phosphor-icons/react/dist/ssr/LockKey";
import { SignInIcon } from "@phosphor-icons/react/dist/ssr/SignIn";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { WifiSlashIcon } from "@phosphor-icons/react/dist/ssr/WifiSlash";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
import { ApiError } from "@/lib/api";
import { signOut } from "@/lib/auth-client";

// No className on purpose, same as EmptyState.
export function ErrorState({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  const client = useQueryClient();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const expired = error instanceof ApiError && error.status === 401;

  async function loginAgain() {
    setPending(true);
    setSignOutError("");
    try {
      const result = await signOut();
      if (result.error)
        throw new Error(result.error.message ?? "Sign out failed.");
      client.clear();
      router.replace("/auth/login");
    } catch (failure) {
      setSignOutError(
        failure instanceof Error ? failure.message : "Sign out failed.",
      );
    } finally {
      setPending(false);
    }
  }

  // Anything that isn't an API response never reached the server.
  const offline = !(error instanceof ApiError);
  const title = expired
    ? "Session Expired"
    : offline
      ? "Can't Reach the Server"
      : "Something Went Wrong";
  const description = expired ? "Sign in again to continue." : error.message;

  return (
    <Empty
      role="alert"
      className="h-full border border-dashed border-destructive/30 bg-destructive/5"
    >
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="bg-destructive/10 text-destructive"
        >
          <AppIcon
            icon={
              expired
                ? LockKeyIcon
                : offline
                  ? WifiSlashIcon
                  : WarningCircleIcon
            }
          />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{signOutError || description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={expired ? loginAgain : retry}
        >
          <AppIcon icon={expired ? SignInIcon : ArrowClockwiseIcon} />
          {expired ? "Sign in again" : "Retry"}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
