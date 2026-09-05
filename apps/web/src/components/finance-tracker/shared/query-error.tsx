"use client";

import { RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { FinanceApiError } from "@/lib/finance-tracker/api";

export function FinanceQueryError({
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
  const expired = error instanceof FinanceApiError && error.status === 401;

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

  return (
    <div className="flex flex-wrap items-center gap-3 py-4" role="alert">
      <p className="text-sm text-destructive">
        {expired ? "Your session expired." : error.message}
      </p>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={expired ? loginAgain : retry}
      >
        <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
        {expired ? "Sign in again" : "Retry"}
      </Button>
      {signOutError && (
        <p className="text-sm text-destructive">{signOutError}</p>
      )}
    </div>
  );
}
