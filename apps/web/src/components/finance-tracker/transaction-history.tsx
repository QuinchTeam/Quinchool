"use client";

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/use-finance-tracker/use-transactions";
import type { TransactionFilters } from "@/lib/finance-tracker/types";
import { FinanceQueryError } from "./shared/query-error";
import { HistoryFilters } from "./transactions/history-filters";
import { TransactionDialog } from "./transactions/transaction-dialog";
import {
  TransactionList,
  TransactionsLoading,
} from "./transactions/transaction-list";

export function TransactionHistory() {
  const [state, setState] = useState<{
    filters: TransactionFilters;
    cursors: (string | null)[];
  }>({ filters: {}, cursors: [null] });
  const query = useTransactions(state.filters, state.cursors.at(-1) ?? null);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          render={<Link href="/finance-tracker" />}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          Finance Tracker
        </Button>
      </div>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Transaction history</h1>
        <TransactionDialog />
      </header>
      <HistoryFilters
        filters={state.filters}
        onChange={(filters) => setState({ filters, cursors: [null] })}
      />
      <section
        aria-label="Transaction history"
        aria-busy={query.isFetching}
        className="min-w-0 border-t"
      >
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
      <nav
        aria-label="Transaction pages"
        className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"
      >
        <span className="text-sm text-muted-foreground" aria-live="polite">
          Page {state.cursors.length}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={state.cursors.length === 1 || query.isFetching}
            onClick={() =>
              setState((previous) => ({
                ...previous,
                cursors: previous.cursors.slice(0, -1),
              }))
            }
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={
              !query.data?.nextCursor || query.isFetching || query.isError
            }
            onClick={() => {
              const cursor = query.data?.nextCursor;
              if (cursor)
                setState((previous) => ({
                  ...previous,
                  cursors: [...previous.cursors, cursor],
                }));
            }}
          >
            Next
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </Button>
        </div>
      </nav>
    </div>
  );
}
