"use client";

import { AppHeader } from "@/components/shared/app-header";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { AppIcon } from "@/components/ui/icon";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/features/finance-tracker/hooks/use-transactions";
import { useFinanceTrackerStore } from "@/features/finance-tracker/store/finance-tracker-store";
import { ErrorState } from "@/components/shared/error-state";
import { HistoryFilters } from "./transactions/history-filters";
import { HistoryPagination } from "./transactions/history-pagination";
import { TransactionDialog } from "./transactions/transaction-dialog";
import { TransactionsLoading } from "./shared/finance-loading";
import { TransactionList } from "./transactions/transaction-list";

export function TransactionHistory() {
  const filters = useFinanceTrackerStore((state) => state.filters);
  const page = useFinanceTrackerStore((state) => state.page);
  const setPage = useFinanceTrackerStore((state) => state.setPage);
  const query = useTransactions(filters, page);
  const data = query.data;

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 p-6">
      <AppHeader title="Transaction History">
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href="/finance-tracker" />}
        >
          <AppIcon icon={CaretLeftIcon} />
          Back to Finance Tracker
        </Button>
        <TransactionDialog />
      </AppHeader>
      <HistoryFilters />
      <section
        aria-label="Transaction history"
        aria-busy={query.isFetching}
        className="min-w-0 border-t has-data-[slot=empty]:pt-6"
      >
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
      {data && data.total > 0 && (
        <HistoryPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          pageCount={data.pageCount}
          busy={query.isFetching}
          onPage={setPage}
        />
      )}
    </div>
  );
}
