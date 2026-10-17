"use client";

import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { FinanceQueryError } from "./query-error";

export function FinanceUnavailable({ status }: { status: number }) {
  const router = useRouter();
  return (
    <div className="grid w-full min-w-0 gap-4 p-6">
      <h1 className="text-2xl font-semibold">Finance Tracker</h1>
      <FinanceQueryError
        error={
          new ApiError(
            "Finance data is unavailable. Please try again.",
            status,
            "FINANCE_UNAVAILABLE",
          )
        }
        retry={() => router.refresh()}
      />
    </div>
  );
}
