import { Skeleton } from "@/components/ui/skeleton";
import { TransactionsLoading } from "../transactions/transaction-list";

export function FinanceLoading() {
  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-8 p-4 sm:p-6"
      role="status"
      aria-label="Loading finance tracker"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Finance Tracker</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </header>
      <Skeleton className="h-32 w-full rounded-md" />
      <section className="grid min-w-0 gap-4">
        <h2 className="text-lg font-semibold">Wallets</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((id) => (
            <Skeleton key={id} className="h-44 rounded-md" />
          ))}
        </div>
      </section>
      <section className="min-w-0 border-t pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Recent transactions</h2>
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
        <TransactionsLoading />
      </section>
    </div>
  );
}

export function FinanceHistoryLoading() {
  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 p-4 sm:p-6"
      role="status"
      aria-label="Loading transaction history"
    >
      <div>
        <Skeleton className="h-8 w-40 rounded-md" />
      </div>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Transaction history</h1>
        <Skeleton className="h-9 w-32 rounded-md" />
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {["wallet", "type"].map((field) => (
          <div key={field} className="grid min-w-0 gap-2">
            <Skeleton className="h-4 w-16 rounded-sm" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
      </div>
      <section className="min-w-0 border-t">
        <TransactionsLoading />
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <Skeleton className="h-5 w-16 rounded-sm" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}
