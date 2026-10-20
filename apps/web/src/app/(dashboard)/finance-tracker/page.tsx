import type { Metadata } from "next";

import { FinanceTrackerPage } from "@/features/finance-tracker/components/finance-tracker-page";

export const metadata: Metadata = { title: "Finance Tracker - Quinchool" };

export default function Page() {
  return <FinanceTrackerPage />;
}
