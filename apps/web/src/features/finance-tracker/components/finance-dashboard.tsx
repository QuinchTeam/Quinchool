"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AppHeader } from "@/components/shared/app-header";
import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";
import { useFinanceOverview } from "@/features/finance-tracker/hooks/use-wallets";
import { formatMoney } from "@/features/finance-tracker/lib/format";
import { BalanceSkeleton, WalletsSkeleton } from "./shared/finance-loading";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
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
      <AppHeader
        icon={WalletIcon}
        title="Finance Tracker"
        description="Track your wallets, income, and spending in one place."
      >
        <WalletDialog />
        <TransferDialog />
        <TransactionDialog />
      </AppHeader>
      {query.error && (
        <ErrorState
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
          <Card role="region" aria-label="Total balance">
            <CardContent className="grid gap-3">
              <p className="font-mono text-sm text-muted-foreground uppercase">
                Total Balance
              </p>
              <p className="break-all font-mono text-3xl font-semibold tabular-nums">
                {formatMoney(data.totalBalance)}
              </p>
              <p className="text-xs text-muted-foreground">
                {data.wallets.length}{" "}
                {data.wallets.length === 1 ? "wallet" : "wallets"}
              </p>
            </CardContent>
          </Card>
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
              <EmptyState
                icon={WalletIcon}
                title="No Wallets Yet"
                description="Add your cash, e-wallets, and bank accounts to see your total balance."
                action={<WalletDialog />}
              />
            )}
          </section>
        </>
      )}
      <CashFlowSummary />
      <RecentTransactions />
    </div>
  );
}
