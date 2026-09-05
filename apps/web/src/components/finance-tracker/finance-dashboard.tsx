"use client";

import { Wallet01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinanceOverview } from "@/hooks/use-finance-tracker/use-wallets";
import { formatMoney } from "@/lib/finance-tracker/format";
import { FinanceQueryError } from "./shared/query-error";
import { RecentTransactions } from "./transactions/recent-transactions";
import { TransactionDialog } from "./transactions/transaction-dialog";
import { WalletDialog } from "./wallets/wallet-dialog";
import { WalletGrid } from "./wallets/wallet-grid";

export function FinanceDashboard() {
  const query = useFinanceOverview();
  const data = query.data;
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-8 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Finance Tracker</h1>
        <div className="flex flex-wrap items-center gap-2">
          <WalletDialog />
          <TransactionDialog />
        </div>
      </header>
      {query.error && (
        <FinanceQueryError
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      )}
      {query.isPending && <Skeleton className="h-32 w-full rounded-md" />}
      {data && (
        <>
          <section
            aria-label="Total balance"
            className="flex min-w-0 flex-col gap-3 rounded-md border bg-card p-5"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HugeiconsIcon
                icon={Wallet01Icon}
                strokeWidth={2}
                className="size-4"
              />
              Total balance
            </div>
            <p className="break-all text-3xl font-semibold tabular-nums">
              {formatMoney(data.totalBalance)}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.wallets.length}{" "}
              {data.wallets.length === 1 ? "wallet" : "wallets"}
            </p>
          </section>
          <section
            aria-labelledby="finance-wallets"
            className="grid min-w-0 gap-4"
          >
            <h2 id="finance-wallets" className="text-lg font-semibold">
              Wallets
            </h2>
            {data.wallets.length ? (
              <WalletGrid wallets={data.wallets} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No wallets yet.
              </p>
            )}
          </section>
        </>
      )}
      <RecentTransactions />
    </div>
  );
}
