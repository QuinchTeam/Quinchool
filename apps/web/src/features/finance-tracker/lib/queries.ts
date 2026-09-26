import { queryOptions } from "@tanstack/react-query";
import { financeRequest } from "./api";
import type {
  FinanceOverview,
  TransactionFilters,
  TransactionPage,
} from "./types";

export const financeKeys = {
  all: (userId: string) => ["finance-tracker", userId] as const,
  overview: (userId: string) =>
    [...financeKeys.all(userId), "overview"] as const,
  transactions: (
    userId: string,
    filters: TransactionFilters,
    cursor: string | null,
    limit: number,
  ) =>
    [
      ...financeKeys.all(userId),
      "transactions",
      filters,
      cursor,
      limit,
    ] as const,
  labels: (userId: string, type: string, search: string) =>
    [...financeKeys.all(userId), "labels", type, search] as const,
};

export function overviewOptions(userId: string) {
  return queryOptions({
    queryKey: financeKeys.overview(userId),
    queryFn: ({ signal }) => financeRequest<FinanceOverview>("", { signal }),
    staleTime: 30_000,
  });
}

export function transactionsPath(
  filters: TransactionFilters = {},
  cursor: string | null = null,
  limit = 20,
) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (filters.walletId) params.set("walletId", filters.walletId);
  if (filters.type) params.set("type", filters.type);
  if (cursor) params.set("cursor", cursor);
  return `/transactions?${params}`;
}

export function transactionsOptions(
  userId: string,
  filters: TransactionFilters = {},
  cursor: string | null = null,
  limit = 20,
) {
  return queryOptions({
    queryKey: financeKeys.transactions(userId, filters, cursor, limit),
    queryFn: ({ signal }) =>
      financeRequest<TransactionPage>(
        transactionsPath(filters, cursor, limit),
        { signal },
      ),
    staleTime: 30_000,
  });
}
