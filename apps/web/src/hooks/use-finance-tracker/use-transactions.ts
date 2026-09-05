"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFinanceUserId } from "@/components/finance-tracker/shared/finance-scope";
import { financeRequest } from "@/lib/finance-tracker/api";
import {
  financeKeys,
  transactionsOptions,
} from "@/lib/finance-tracker/queries";
import type {
  TransactionFilters,
  TransactionInput,
} from "@/lib/finance-tracker/types";

export function useTransactions(
  filters: TransactionFilters = {},
  cursor: string | null = null,
  limit = 20,
) {
  return useQuery(
    transactionsOptions(useFinanceUserId(), filters, cursor, limit),
  );
}

export function useSaveTransaction() {
  const userId = useFinanceUserId();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: TransactionInput }) =>
      financeRequest<{ id: string }>(
        id ? `/transactions/${id}` : "/transactions",
        {
          method: id ? "PUT" : "POST",
          body: JSON.stringify(values),
        },
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: financeKeys.all(userId) }),
  });
}

export function useDeleteTransaction() {
  const userId = useFinanceUserId();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      financeRequest<void>(`/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: financeKeys.all(userId) }),
  });
}
