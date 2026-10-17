import "server-only";

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { cookies } from "next/headers";
import { financeRequest } from "@/features/finance-tracker/lib/api";
import {
  financeKeys,
  requestTransactionPage,
  transactionsOptions,
} from "@/features/finance-tracker/lib/queries";
import type { FinanceOverview } from "@/features/finance-tracker/lib/types";
import { ApiError } from "@/lib/api";
import { FinanceDashboard } from "./finance-dashboard";
import { FinanceScope } from "./shared/finance-scope";
import { FinanceUnavailable } from "./shared/finance-unavailable";
import { TransactionHistory } from "./transaction-history";

export async function FinanceServerPage({
  history = false,
}: {
  history?: boolean;
}) {
  const cookieStore = await cookies();
  const headers = { cookie: cookieStore.toString() };
  let overview: FinanceOverview;
  try {
    overview = await financeRequest<FinanceOverview>("", { headers });
  } catch (error) {
    return (
      <FinanceUnavailable
        status={error instanceof ApiError ? error.status : 503}
      />
    );
  }
  const client = new QueryClient();
  client.setQueryData(financeKeys.overview(overview.userId), overview);
  const limit = history ? 20 : 5;
  await client.prefetchQuery({
    ...transactionsOptions(overview.userId, {}, null, limit),
    queryFn: () => requestTransactionPage({}, null, limit, { headers }),
  });

  return (
    <FinanceScope userId={overview.userId}>
      <HydrationBoundary state={dehydrate(client)}>
        {history ? <TransactionHistory /> : <FinanceDashboard />}
      </HydrationBoundary>
    </FinanceScope>
  );
}
