"use client";

import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { AppIcon } from "@/components/ui/icon";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/features/finance-tracker/hooks/use-transactions";
import { ErrorState } from "@/components/shared/error-state";
import { TransactionsLoading } from "../shared/finance-loading";
import { TransactionList } from "./transaction-list";

export function RecentTransactions() {
  const query = useTransactions({}, 1, 5);
  return (
    <section
      aria-labelledby="recent-transactions"
      className="flex min-w-0 flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="recent-transactions" className="text-lg font-semibold">
          Recent Transactions
        </h2>
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          render={<Link href="/finance-tracker/transactions" />}
        >
          View history
          <AppIcon icon={CaretRightIcon} />
        </Button>
      </div>
      {query.error && (
        <ErrorState
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      )}
      {query.isPending ? (
        <TransactionsLoading />
      ) : (
        query.data && <TransactionList transactions={query.data.items} />
      )}
    </section>
  );
}
