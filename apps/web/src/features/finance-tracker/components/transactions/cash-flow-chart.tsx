"use client";

import { ChartBarIcon } from "@phosphor-icons/react/dist/ssr/ChartBar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { manilaNowKey, niceTicks } from "@/features/finance-tracker/lib/chart";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/features/finance-tracker/lib/format";
import type {
  FinanceSummary,
  SummaryPeriod,
} from "@/features/finance-tracker/lib/types";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionDialog } from "./transaction-dialog";

// Format Manila wall-clock buckets as UTC so the displayed time does not shift.
function formatBucket(
  bucket: string,
  period: SummaryPeriod,
  style: "axis" | "title",
) {
  const date = new Date(`${bucket}:00Z`);
  const title = style === "title";
  const options: Intl.DateTimeFormatOptions =
    period === "day"
      ? { hour: "numeric", ...(title && { minute: "2-digit" }) }
      : period === "year"
        ? { month: title ? "long" : "short", ...(title && { year: "numeric" }) }
        : period === "week"
          ? {
              weekday: title ? "long" : "short",
              ...(title && { month: "short", day: "numeric" }),
            }
          : title
            ? { weekday: "short", month: "long", day: "numeric" }
            : { day: "numeric" };
  return date.toLocaleString("en-PH", { timeZone: "UTC", ...options });
}

const compact = new Intl.NumberFormat("en-PH", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const INCOME_FILL = "bg-emerald-600 dark:bg-emerald-400";
const EXPENSE_FILL = "bg-rose-600 dark:bg-rose-400";

// Plot income and expense against a shared zero baseline.
// Dim future buckets so they do not look like missing historical data.
export function CashFlowChart({ summary }: { summary: FinanceSummary }) {
  const max = Math.max(
    ...summary.buckets.flatMap((b) => [Number(b.income), Number(b.expense)]),
  );
  if (max === 0) {
    return (
      <div className="h-72">
        <EmptyState
          icon={ChartBarIcon}
          title="Nothing to Chart Yet"
          description="Income and spending for this period will show up here as bars."
          action={<TransactionDialog />}
        />
      </div>
    );
  }
  const ticks = niceTicks(max);
  const top = ticks.at(-1) ?? max;
  const now = manilaNowKey();
  // Show at most 12 axis labels to avoid overlaps.
  const every = Math.ceil(summary.buckets.length / 12);
  const percent = (value: number) => `${(value / top) * 100}%`;

  return (
    <figure className="flex h-72 min-w-0 flex-col gap-3 rounded-md border bg-card p-5">
      <figcaption className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className={`size-2.5 rounded-xs ${INCOME_FILL}`} />
          Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`size-2.5 rounded-xs ${EXPENSE_FILL}`} />
          Expense
        </span>
      </figcaption>
      <div className="flex min-h-0 flex-1 gap-3 pt-3">
        <div
          aria-hidden
          className="relative w-10 shrink-0 text-xs text-muted-foreground tabular-nums"
        >
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 translate-y-1/2 leading-none"
              style={{ bottom: percent(tick) }}
            >
              {compact.format(tick)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          {ticks.map((tick) => (
            <span
              key={tick}
              aria-hidden
              className={cn(
                "absolute inset-x-0 border-t",
                tick === 0 ? "border-border" : "border-border/50",
              )}
              style={{ bottom: percent(tick) }}
            />
          ))}
          <ul className="relative flex h-full items-end">
            {summary.buckets.map((b) => {
              const income = Number(b.income);
              const expense = Number(b.expense);
              const net = income - expense;
              const future = b.bucket > now;
              const title = formatBucket(b.bucket, summary.period, "title");
              return (
                <Tooltip key={b.bucket}>
                  <TooltipTrigger
                    render={<li />}
                    tabIndex={0}
                    aria-label={`${title}: earned ${formatMoney(b.income)}, spent ${formatMoney(b.expense)}`}
                    className={cn(
                      "flex h-full min-w-0 flex-1 items-end justify-center gap-0.5 rounded-t-sm px-0.5 outline-none hover:bg-muted/60 focus-visible:bg-muted/60",
                      future && "opacity-40",
                    )}
                  >
                    <span
                      className={`w-full max-w-6 rounded-t-sm ${INCOME_FILL}`}
                      style={{ height: percent(income) }}
                    />
                    <span
                      className={`w-full max-w-6 rounded-t-sm ${EXPENSE_FILL}`}
                      style={{ height: percent(expense) }}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="flex-col items-stretch gap-1.5">
                    <p className="font-semibold">{title}</p>
                    <TooltipRow
                      fill={INCOME_FILL}
                      label="Income"
                      value={formatMoney(b.income)}
                    />
                    <TooltipRow
                      fill={EXPENSE_FILL}
                      label="Expense"
                      value={formatMoney(b.expense)}
                    />
                    <div className="flex items-center justify-between gap-6 border-t border-border pt-1.5">
                      <span className="text-muted-foreground">Net</span>
                      <span className="font-semibold tabular-nums">
                        {net < 0 ? "-" : "+"}
                        {formatMoney(Math.abs(net).toFixed(2))}
                      </span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </ul>
        </div>
      </div>
      <div aria-hidden className="flex gap-3 text-xs text-muted-foreground">
        <span className="w-10 shrink-0" />
        <div className="flex min-w-0 flex-1">
          {summary.buckets.map((b, i) => (
            <span
              key={b.bucket}
              className={cn(
                "min-w-0 flex-1 truncate text-center",
                b.bucket > now && "opacity-40",
              )}
            >
              {i % every === 0
                ? formatBucket(b.bucket, summary.period, "axis")
                : ""}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}

function TooltipRow({
  fill,
  label,
  value,
}: {
  fill: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className={`h-0.5 w-3 rounded-full ${fill}`} />
        {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
