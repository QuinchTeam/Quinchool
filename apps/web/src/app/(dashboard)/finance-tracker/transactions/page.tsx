import type { Metadata } from "next";

import { FinanceTrackerTransactionsPage } from "@/features/finance-tracker/components/finance-tracker-transactions-page";

export const metadata: Metadata = {
  title: "Finance Tracker Transactions - Quinchool",
};

export default function Page() {
  return <FinanceTrackerTransactionsPage />;
}
