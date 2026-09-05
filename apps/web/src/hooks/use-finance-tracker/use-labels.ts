"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useFinanceUserId } from "@/components/finance-tracker/shared/finance-scope";
import { financeRequest } from "@/lib/finance-tracker/api";
import { financeKeys } from "@/lib/finance-tracker/queries";
import type {
  TransactionLabel,
  TransactionType,
} from "@/lib/finance-tracker/types";

export function useFinanceLabels(type: TransactionType, search: string) {
  const userId = useFinanceUserId();
  const [debounced, setDebounced] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(timer);
  }, [search]);
  return useQuery({
    queryKey: financeKeys.labels(userId, type, debounced),
    queryFn: ({ signal }) =>
      financeRequest<TransactionLabel[]>(
        `/labels?${new URLSearchParams({ type, search: debounced })}`,
        { signal },
      ),
    staleTime: 60_000,
  });
}
