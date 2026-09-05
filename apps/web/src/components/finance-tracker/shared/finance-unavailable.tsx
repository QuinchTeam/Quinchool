"use client";

import { useRouter } from "next/navigation";
import { FinanceApiError } from "@/lib/finance-tracker/api";
import { FinanceQueryError } from "./query-error";

export function FinanceUnavailable({ status }: { status: number }) {
  const router = useRouter();
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-7xl gap-4 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Finance Tracker</h1>
      <FinanceQueryError
        error={
          new FinanceApiError(
            "Finance data is unavailable. Please try again.",
            status,
          )
        }
        retry={() => router.refresh()}
      />
    </div>
  );
}
