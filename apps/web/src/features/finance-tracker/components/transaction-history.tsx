"use client";

import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { AppIcon } from "@/components/ui/icon";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/features/finance-tracker/hooks/use-transactions";
import type { TransactionFilters } from "@/features/finance-tracker/lib/types";
import { FinanceQueryError } from "./shared/query-error";
import { HistoryFilters } from "./transactions/history-filters";
import { HistoryPagination } from "./transactions/history-pagination";
import { TransactionDialog } from "./transactions/transaction-dialog";
import { TransactionsLoading } from "./shared/finance-loading";
import { TransactionList } from "./transactions/transaction-list";

export function TransactionHistory() {
  const [state, setState] = useState<{
    filters: TransactionFilters;
    page: number;
  }>({ filters: {}, page: 1 });
  const query = useTransactions(state.filters, state.page);
  const data = query.data;

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Transaction History</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href="/finance-tracker" />}
          >
            <AppIcon icon={CaretLeftIcon} />
            Back to Finance Tracker
          </Button>
          <TransactionDialog />
        </div>
      </header>
      <HistoryFilters
        filters={state.filters}
        onChange={(filters) => setState({ filters, page: 1 })}
      />
      <section
        aria-label="Transaction history"
        aria-busy={query.isFetching}
        className="min-w-0 border-t has-data-[slot=empty]:pt-6"
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
      {data && data.total > 0 && (
        <HistoryPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          pageCount={data.pageCount}
          busy={query.isFetching}
          onPage={(page) => setState((previous) => ({ ...previous, page }))}
        />
      )}
    </div>
  );
}
