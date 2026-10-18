export function formatMoney(amount: string) {
  const negative = amount.startsWith("-");
  const [whole, fraction = ""] = amount.replace(/^-/, "").split(".");
  return `${negative ? "-" : ""}PHP ${BigInt(whole).toLocaleString("en-PH")}.${fraction.padEnd(2, "0")}`;
}

const transactionDate = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export function formatTransactionDate(value: string) {
  return transactionDate.format(new Date(value));
}

export function toLocalDateTime(value = new Date().toISOString()) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

/**
 * How a signed amount reads: money in is emerald, money out is destructive.
 * Shared so the dashboard and the tracker cannot drift apart.
 */
export function amountClassName(type: "INCOME" | "EXPENSE") {
  return type === "INCOME"
    ? "text-emerald-700 dark:text-emerald-400"
    : "text-destructive";
}

/** First is the app primary (dark theme); the rest are popular Tailwind 500 hues. */
export const WALLET_COLORS = [
  "#2ec4b6", // primary
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#f59e0b", // amber
  "#22c55e", // green
];
