"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFinanceScope } from "@/features/finance-tracker/components/shared/finance-scope";
import { financeRequest } from "@/features/finance-tracker/lib/api";
import {
  financeKeys,
  summaryOptions,
  transactionsOptions,
} from "@/features/finance-tracker/lib/queries";
import type {
  SummaryPeriod,
  TransactionFilters,
  TransactionInput,
  TransferInput,
} from "@/features/finance-tracker/lib/types";

export function useTransactions(
  filters: TransactionFilters = {},
  page = 1,
  limit = 20,
) {
  return useQuery(transactionsOptions(useFinanceScope(), filters, page, limit));
}

export function useSummary(period: SummaryPeriod) {
  return useQuery(summaryOptions(useFinanceScope(), period));
}

export function useSaveTransaction() {
  const userId = useFinanceScope();
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
  const userId = useFinanceScope();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      financeRequest<void>(`/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: financeKeys.all(userId) }),
  });
}

export function useCreateTransfer() {
  const userId = useFinanceScope();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (values: TransferInput) =>
      financeRequest<{ transactionIds: string[] }>("/transfers", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: financeKeys.all(userId) }),
  });
}
