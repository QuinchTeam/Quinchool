"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFinanceUserId } from "@/components/finance-tracker/shared/finance-scope";
import { financeRequest } from "@/lib/finance-tracker/api";
import { financeKeys, overviewOptions } from "@/lib/finance-tracker/queries";
import type { FinanceOverview, WalletInput } from "@/lib/finance-tracker/types";

export function useFinanceOverview() {
  return useQuery(overviewOptions(useFinanceUserId()));
}

export function useSaveWallet() {
  const userId = useFinanceUserId();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: WalletInput }) =>
      financeRequest<{ id: string }>(id ? `/wallets/${id}` : "/wallets", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: financeKeys.all(userId) }),
  });
}

export function useDeleteWallet() {
  const userId = useFinanceUserId();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      financeRequest<void>(`/wallets/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: financeKeys.all(userId) }),
  });
}

export function useReorderWallets() {
  const userId = useFinanceUserId();
  const client = useQueryClient();
  const queryKey = financeKeys.overview(userId);
  return useMutation({
    mutationFn: (ids: string[]) =>
      financeRequest<void>("/wallets/order", {
        method: "PUT",
        body: JSON.stringify({ ids }),
      }),
    onMutate: async (ids) => {
      await client.cancelQueries({ queryKey });
      const previous = client.getQueryData<FinanceOverview>(queryKey);
      if (previous) {
        const order = new Map(ids.map((id, index) => [id, index]));
        client.setQueryData<FinanceOverview>(queryKey, {
          ...previous,
          wallets: [...previous.wallets].sort(
            (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) client.setQueryData(queryKey, context.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey }),
  });
}
