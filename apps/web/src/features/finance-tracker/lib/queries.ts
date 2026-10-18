import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { financeEnvelopeRequest, financeRequest } from "./api";
import type {
  FinanceOverview,
  FinanceSummary,
  HistoryPeriod,
  SummaryPeriod,
  Transaction,
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
    page: number,
    limit: number,
  ) =>
    [...financeKeys.all(userId), "transactions", filters, page, limit] as const,
  summary: (userId: string, period: SummaryPeriod) =>
    [...financeKeys.all(userId), "summary", period] as const,
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

/** Period presets in the browser's local time, as `[from, to)` instants. */
export function periodRange(period: HistoryPeriod, now = new Date()) {
  const day = (offset = 0) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  const month = (offset = 0) =>
    new Date(now.getFullYear(), now.getMonth() + offset, 1);
  switch (period) {
    case "today":
      return { from: day(), to: day(1) };
    case "last7":
      return { from: day(-6), to: day(1) };
    case "thisMonth":
      return { from: month(), to: month(1) };
    case "lastMonth":
      return { from: month(-1), to: month() };
    case "thisYear":
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: new Date(now.getFullYear() + 1, 0, 1),
      };
  }
}

export function transactionsPath(
  filters: TransactionFilters = {},
  page = 1,
  limit = 20,
) {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });
  if (filters.walletId) params.set("walletId", filters.walletId);
  if (filters.type) params.set("type", filters.type);
  if (filters.search) params.set("search", filters.search);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.excludeTransfers) params.set("excludeTransfers", "true");
  if (filters.period) {
    const { from, to } = periodRange(filters.period);
    params.set("from", from.toISOString());
    params.set("to", to.toISOString());
  }
  return `/transactions?${params}`;
}

export function transactionsOptions(
  userId: string,
  filters: TransactionFilters = {},
  page = 1,
  limit = 20,
) {
  return queryOptions({
    queryKey: financeKeys.transactions(userId, filters, page, limit),
    queryFn: ({ signal }) =>
      requestTransactionPage(filters, page, limit, { signal }),
    staleTime: 30_000,
    // Keep the current page on screen while the next one loads.
    placeholderData: keepPreviousData,
  });
}

/** Transactions come back as `{ data, meta: { page, pageSize, total, pageCount } }`. */
export async function requestTransactionPage(
  filters: TransactionFilters = {},
  page = 1,
  limit = 20,
  init: RequestInit = {},
): Promise<TransactionPage> {
  const { data, meta } = await financeEnvelopeRequest<
    Transaction[],
    Omit<TransactionPage, "items">
  >(transactionsPath(filters, page, limit), init);
  return {
    items: data,
    page: meta?.page ?? page,
    pageSize: meta?.pageSize ?? limit,
    total: meta?.total ?? data.length,
    pageCount: meta?.pageCount ?? 1,
  };
}

export function summaryOptions(userId: string, period: SummaryPeriod) {
  return queryOptions({
    queryKey: financeKeys.summary(userId, period),
    queryFn: ({ signal }) =>
      financeRequest<FinanceSummary>(`/summary?period=${period}`, { signal }),
    staleTime: 30_000,
  });
}
