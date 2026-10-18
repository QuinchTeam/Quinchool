"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useFinanceScope } from "@/features/finance-tracker/components/shared/finance-scope";
import { financeRequest } from "@/features/finance-tracker/lib/api";
import { financeKeys } from "@/features/finance-tracker/lib/queries";
import type {
  TransactionLabel,
  TransactionType,
} from "@/features/finance-tracker/lib/types";

export function useFinanceLabels(type: TransactionType, search: string) {
  const userId = useFinanceScope();
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
