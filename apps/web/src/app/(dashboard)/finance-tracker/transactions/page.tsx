import type { Metadata } from "next";
import { FinanceServerPage } from "@/components/finance-tracker/finance-server-page";

export const metadata: Metadata = { title: "Transaction History - Quinchool" };

export default function TransactionHistoryPage() {
  return <FinanceServerPage history />;
}
