import type { Metadata } from "next";
import { FinanceServerPage } from "@/features/finance-tracker/components/finance-server-page";

export const metadata: Metadata = { title: "Finance Tracker - Quinchool" };

export default function FinanceTrackerPage() {
  return <FinanceServerPage />;
}
