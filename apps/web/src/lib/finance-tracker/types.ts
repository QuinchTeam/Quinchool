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
  nextCursor: string | null;
}

export interface TransactionFilters {
  walletId?: string;
  type?: TransactionType;
}

export interface TransactionLabel {
  id: string;
  name: string;
  type: TransactionType;
}
