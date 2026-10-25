import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";
import { AppHeader } from "@/components/shared/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function TextSkeleton({
  className,
  text,
}: {
  className?: string;
  text: string;
}) {
  return (
    <Skeleton
      aria-hidden
      className={cn("w-fit select-none text-transparent", className)}
    >
      {text}
    </Skeleton>
  );
}

export function BalanceSkeleton() {
  return (
    <Card>
      <CardContent className="grid gap-3">
        <TextSkeleton className="text-sm" text="Total Balance ··" />
        <TextSkeleton className="text-3xl font-semibold" text="₱00,000.00" />
        <TextSkeleton className="text-xs" text="2 wallets" />
      </CardContent>
    </Card>
  );
}

export function WalletsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((id) => (
        <div
          key={id}
          className="flex min-w-0 flex-col gap-4 rounded-md border border-t-4 bg-card p-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="size-10 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <TextSkeleton className="font-semibold" text="Wallet name" />
              <TextSkeleton className="text-xs" text="Digital Bank" />
            </div>
            <Skeleton className="size-12 shrink-0" />
          </div>
          <TextSkeleton className="text-xl font-semibold" text="₱0,000.00" />
          <div className="mt-auto flex items-center justify-between gap-2">
            <TextSkeleton className="text-xs" text="0 transactions" />
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((action) => (
                <Skeleton key={action} className="size-12" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const CHART_BARS = [40, 65, 30, 80, 55, 20, 70, 45, 60, 35, 75, 50];

export function CashFlowSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((id) => (
          <Card key={id} variant="minimal" className="gap-2">
            <TextSkeleton className="text-sm" text="Earned This Month" />
            <TextSkeleton className="text-2xl font-semibold" text="₱0,000.00" />
          </Card>
        ))}
      </div>
      <div className="flex h-72 min-w-0 flex-col gap-3 rounded-md border bg-card p-5">
        <TextSkeleton className="text-xs" text="Income ·· Expense" />
        <div className="flex min-h-0 flex-1 items-end gap-1">
          {CHART_BARS.map((height, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-b-none"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <TextSkeleton className="w-full text-xs" text="axis" />
      </div>
    </>
  );
}

export function TransactionsLoading() {
  return (
    <output className="grid" aria-label="Loading transactions">
      {[1, 2, 3, 4, 5].map((row) => (
        <div
          key={row}
          className="flex items-center gap-3 border-b py-4 last:border-b-0"
        >
          <Skeleton className="size-12 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col">
            <TextSkeleton
              className="text-sm font-medium"
              text="Transaction label"
            />
            <TextSkeleton
              className="mt-1 text-xs"
              text="Wallet name · Some notes here"
            />
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <TextSkeleton
              className="text-base font-semibold"
              text="+₱0,000.00"
            />
            <TextSkeleton
              className="mt-1 text-xs"
              text="Oct 18, 2026, 9:00 PM"
            />
          </div>
        </div>
      ))}
    </output>
  );
}

export function FinanceLoading() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-8 p-6" aria-busy="true">
      <AppHeader
        icon={WalletIcon}
        title="Finance Tracker"
        description="Track your wallets, income, and spending in one place."
      >
        <TextSkeleton className="h-14 px-6" text="+ Add wallet" />
        <TextSkeleton className="h-14 px-6" text="⇆ Transfer" />
        <TextSkeleton className="h-14 px-6" text="+ Add transaction" />
      </AppHeader>
      <BalanceSkeleton />
      <section className="grid min-w-0 gap-4">
        <h2 className="text-lg font-semibold">Wallets</h2>
        <WalletsSkeleton />
      </section>
      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Cash Flow</h2>
          <TextSkeleton
            className="h-12 px-3"
            text="Today This Week This Month This Year"
          />
        </div>
        <CashFlowSkeleton />
      </section>
      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <TextSkeleton className="h-12 px-5" text="View history >" />
        </div>
        <TransactionsLoading />
      </section>
    </div>
  );
}

export function FinanceHistoryLoading() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6 p-6" aria-busy="true">
      <AppHeader title="Transaction History">
        <TextSkeleton className="h-14 px-6" text="< Back to Finance Tracker" />
        <TextSkeleton className="h-14 px-6" text="+ Add transaction" />
      </AppHeader>
      <Card>
        <CardHeader>
          <CardTitle>Filter History</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Skeleton className="h-14 sm:col-span-2" />
            {["wallet", "type", "period", "sort"].map((field) => (
              <Skeleton key={field} className="h-14" />
            ))}
          </div>
          <TextSkeleton
            className="text-sm"
            text="[] Hide transfers between wallets"
          />
        </CardContent>
      </Card>
      <section className="min-w-0 border-t">
        <TransactionsLoading />
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <TextSkeleton
          className="text-sm"
          text="Showing 1–20 of 000 transactions"
        />
        <div className="flex items-center gap-1">
          <TextSkeleton className="h-14 px-6" text="< Previous" />
          {[1, 2, 3].map((page) => (
            <Skeleton key={page} className="size-14" />
          ))}
          <TextSkeleton className="h-14 px-6" text="Next >" />
        </div>
      </div>
    </div>
  );
}
