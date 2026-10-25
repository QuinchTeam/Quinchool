"use client";

import { Card } from "@/components/ui/card";
import { ArrowDownLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowDownLeft";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { useSyncExternalStore } from "react";
import { AppIcon } from "@/components/ui/icon";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSummary } from "@/features/finance-tracker/hooks/use-transactions";
import {
  amountClassName,
  formatMoney,
} from "@/features/finance-tracker/lib/format";
import type { SummaryPeriod } from "@/features/finance-tracker/lib/types";
import { CashFlowSkeleton } from "../shared/finance-loading";
import { ErrorState } from "@/components/shared/error-state";
import { CashFlowChart } from "./cash-flow-chart";

const PERIODS: Record<SummaryPeriod, string> = {
  day: "Today",
  week: "This Week",
  month: "This Month",
  year: "This Year",
};
const STORAGE_KEY = "finance-tracker:summary-period";

// shortcut: chart period is browser-local; use the API to sync it across devices.
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readPeriod(): SummaryPeriod {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved && saved in PERIODS ? (saved as SummaryPeriod) : "year";
}

function setPeriod(next: SummaryPeriod) {
  localStorage.setItem(STORAGE_KEY, next);
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

export function CashFlowSummary() {
  const period = useSyncExternalStore(
    subscribe,
    readPeriod,
    (): SummaryPeriod => "year",
  );
  const query = useSummary(period);
  const data = query.data;
  const label = PERIODS[period];
  return (
    <section
      aria-labelledby="cash-flow"
      className="flex min-w-0 flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="cash-flow" className="text-lg font-semibold">
          Cash Flow
        </h2>
        <ToggleGroup
          aria-label="Summary period"
          value={[period]}
          onValueChange={(values) => {
            if (values[0]) setPeriod(values[0] as SummaryPeriod);
          }}
          variant="outline"
          size="sm"
        >
          {Object.entries(PERIODS).map(([value, text]) => (
            <ToggleGroupItem key={value} value={value}>
              {text}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {query.error && (
        <ErrorState
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      )}
      {query.isPending && <CashFlowSkeleton />}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Total
              type="INCOME"
              title={`Earned ${label}`}
              amount={data.income}
            />
            <Total
              type="EXPENSE"
              title={`Spent ${label}`}
              amount={data.expense}
            />
          </div>
          <CashFlowChart summary={data} />
        </>
      )}
    </section>
  );
}

function Total({
  type,
  title,
  amount,
}: {
  type: "INCOME" | "EXPENSE";
  title: string;
  amount: string;
}) {
  return (
    <Card variant="minimal" className="gap-2 font-mono">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AppIcon
          icon={type === "INCOME" ? ArrowUpRightIcon : ArrowDownLeftIcon}
          className={`dither animate-dither size-7 motion-reduce:animate-none ${amountClassName(type)}`}
        />
        {title}
      </div>
      <p
        className={`break-all text-2xl font-semibold tabular-nums ${amountClassName(type)}`}
      >
        {formatMoney(amount)}
      </p>
    </Card>
  );
}
