"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const REVIEW_FILTERS = [
  "REJECTED",
  "POTENTIAL",
  "MATCH",
  "ALL",
] as const;
export type ReviewFilter = (typeof REVIEW_FILTERS)[number];

// Filter lives in the URL so the filter bar and job list share it without props.
export function useReviewFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const param = useSearchParams().get("verdict")?.toUpperCase();
  const filter = REVIEW_FILTERS.find((item) => item === param) ?? "REJECTED";

  function setFilter(next: ReviewFilter) {
    router.replace(
      next === "REJECTED"
        ? pathname
        : `${pathname}?verdict=${next.toLowerCase()}`,
      { scroll: false },
    );
  }

  return [filter, setFilter] as const;
}
