import type { Metadata } from "next";

import { DashboardHome } from "@/features/dashboard/components/dashboard-home";

export const metadata: Metadata = { title: "Dashboard - Quinchool" };

export default function Home() {
  return <DashboardHome />;
}
