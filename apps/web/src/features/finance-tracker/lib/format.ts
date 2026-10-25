export function formatMoney(amount: string) {
  const negative = amount.startsWith("-");
  const [whole, fraction = ""] = amount.replace(/^-/, "").split(".");
  return `${negative ? "-" : ""}₱${BigInt(whole).toLocaleString("en-PH")}.${fraction.padEnd(2, "0")}`;
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

export function amountClassName(type: "INCOME" | "EXPENSE") {
  return type === "INCOME"
    ? "text-emerald-700 dark:text-emerald-400"
    : "text-destructive";
}

// Keep the dark-theme primary color first as the default wallet color.
export const WALLET_COLORS = [
  "#2ec4b6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#f59e0b",
  "#22c55e",
];
