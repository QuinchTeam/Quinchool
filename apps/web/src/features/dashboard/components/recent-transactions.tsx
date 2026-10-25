import "server-only";

import { PlusCircleIcon } from "@phosphor-icons/react/dist/ssr/PlusCircle";
import { ReceiptIcon } from "@phosphor-icons/react/dist/ssr/Receipt";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/icon";
import {
  DashboardPanel,
  DashboardPanelSkeleton,
} from "@/features/dashboard/components/dashboard-panel";
import { loadRecentTransactions } from "@/features/dashboard/lib/load";
import {
  amountClassName,
  formatMoney,
  formatTransactionDate,
} from "@/features/finance-tracker/lib/format";
import { cn } from "@/lib/utils";

export function RecentTransactions() {
  return (
    <Suspense
      fallback={<DashboardPanelSkeleton label="Loading recent transactions" />}
    >
      <TransactionsPanel />
    </Suspense>
  );
}

async function TransactionsPanel() {
  const transactions = await loadRecentTransactions();

  return (
    <DashboardPanel
      title="Recent transactions"
      footerHref="/finance-tracker/transactions"
      footerLabel="View more transactions"
    >
      {transactions?.length ? (
        transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex min-w-0 items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {transaction.label.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {transaction.wallet.name} ·{" "}
                {formatTransactionDate(transaction.occurredAt)}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 font-mono text-sm font-medium",
                amountClassName(transaction.type),
              )}
            >
              {transaction.type === "INCOME" ? "+" : "-"}
              {formatMoney(transaction.amount)}
            </span>
          </div>
        ))
      ) : (
        <EmptyState
          icon={ReceiptIcon}
          title="No Transactions Yet"
          description="Record income or an expense to see it here."
          action={
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/finance-tracker" />}
            >
              <AppIcon icon={PlusCircleIcon} />
              Add transaction
            </Button>
          }
        />
      )}
    </DashboardPanel>
  );
}
