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

export const WALLET_COLORS = [
  "#0f766e",
  "#2563eb",
  "#be123c",
  "#7c3aed",
  "#15803d",
  "#a16207",
];
