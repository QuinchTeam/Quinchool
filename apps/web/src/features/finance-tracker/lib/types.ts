export const WALLET_TYPES = {
  CASH: "Cash",
  EWALLET: "E-Wallet",
  TRADITIONAL_BANK: "Traditional Bank",
  DIGITAL_BANK: "Digital Bank",
} as const;

export type WalletType = keyof typeof WALLET_TYPES;
export type TransactionType = "INCOME" | "EXPENSE";

export interface WalletInput {
  name: string;
  type: WalletType;
  color: string;
  openingBalance: string;
}

export interface Wallet extends WalletInput {
  id: string;
  balance: string;
  transactionCount: number;
}

export interface FinanceOverview {
  userId: string;
  currency: "PHP";
  totalBalance: string;
  wallets: Wallet[];
}

export interface TransactionInput {
  walletId: string;
  type: TransactionType;
  amount: string;
  label: string;
  notes: string;
  occurredAt: string;
}

export interface TransferInput {
  fromWalletId: string;
  toWalletId: string;
  amount: string;
  notes: string;
  occurredAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  notes: string | null;
  occurredAt: string;
  wallet: Pick<Wallet, "id" | "name" | "color">;
  label: { id: string; name: string };
}

export interface TransactionPage {
  items: Transaction[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export type HistoryPeriod =
  | "today"
  | "last7"
  | "thisMonth"
  | "lastMonth"
  | "thisYear";
export type TransactionSort = "newest" | "oldest" | "highest" | "lowest";

export interface TransactionFilters {
  walletId?: string;
  type?: TransactionType;
  search?: string;
  period?: HistoryPeriod;
  sort?: TransactionSort;
  excludeTransfers?: boolean;
}

export interface TransactionLabel {
  id: string;
  name: string;
  type: TransactionType;
}

export type SummaryPeriod = "day" | "week" | "month" | "year";

export interface FinanceSummary {
  period: SummaryPeriod;
  income: string;
  expense: string;
  // bucket is Manila wall-clock time in YYYY-MM-DDTHH:mm form.
  buckets: { bucket: string; income: string; expense: string }[];
}
