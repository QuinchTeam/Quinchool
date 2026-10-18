"use client";

import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AppIcon } from "@/components/ui/icon";
import { useFinanceOverview } from "@/features/finance-tracker/hooks/use-wallets";
import { formatMoney } from "@/features/finance-tracker/lib/format";
import { BalanceSkeleton, WalletsSkeleton } from "./shared/finance-loading";
import { FinanceQueryError } from "./shared/query-error";
import { CashFlowSummary } from "./transactions/cash-flow-summary";
import { RecentTransactions } from "./transactions/recent-transactions";
import { TransactionDialog } from "./transactions/transaction-dialog";
import { TransferDialog } from "./transfers/transfer-dialog";
import { WalletDialog } from "./wallets/wallet-dialog";
import { WalletGrid } from "./wallets/wallet-grid";

export function FinanceDashboard() {
  const query = useFinanceOverview();
  const data = query.data;
  return (
    <div className="flex w-full min-w-0 flex-col gap-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="flex items-center gap-3 text-2xl font-semibold">
            <AppIcon icon={WalletIcon} className="size-7 shrink-0" />
            Finance Tracker
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your wallets, income, and spending in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WalletDialog />
          <TransferDialog />
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
      {query.isPending && (
        <>
          <BalanceSkeleton />
          <section className="grid min-w-0 gap-4">
            <h2 className="text-lg font-semibold">Wallets</h2>
            <WalletsSkeleton />
          </section>
        </>
      )}
      {data && (
        <>
          <section
            aria-label="Total balance"
            className="flex min-w-0 flex-col gap-3 rounded-md border bg-card p-5"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AppIcon icon={WalletIcon} className="size-4" />
              Total Balance
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
              <Empty className="border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <AppIcon icon={WalletIcon} />
                  </EmptyMedia>
                  <EmptyTitle>No Wallets Yet</EmptyTitle>
                  <EmptyDescription>
                    Add your cash, e-wallets, and bank accounts to see your
                    total balance.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <WalletDialog />
                </EmptyContent>
              </Empty>
            )}
          </section>
        </>
      )}
      <CashFlowSummary />
      <RecentTransactions />
    </div>
  );
}
