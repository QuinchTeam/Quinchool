"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/use-finance-tracker/use-transactions";
import { FinanceQueryError } from "../shared/query-error";
import { TransactionList, TransactionsLoading } from "./transaction-list";

export function RecentTransactions() {
  const query = useTransactions({}, null, 5);
  return (
    <section
      aria-labelledby="recent-transactions"
      className="min-w-0 border-t pt-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="recent-transactions" className="text-lg font-semibold">
          Recent transactions
        </h2>
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          render={<Link href="/finance-tracker/transactions" />}
        >
          View history
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
        </Button>
      </div>
      {query.error && (
        <FinanceQueryError
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
