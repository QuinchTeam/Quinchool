import type { Metadata } from "next";
import { FinanceServerPage } from "@/features/finance-tracker/components/finance-server-page";

export const metadata: Metadata = { title: "Transaction History - Quinchool" };

export default function TransactionHistoryPage() {
  return <FinanceServerPage history />;
}
