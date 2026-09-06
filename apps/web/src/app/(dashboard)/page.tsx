import type { Metadata } from "next";

import { DashboardHome } from "@/components/dashboard/dashboard-home";

export const metadata: Metadata = { title: "Dashboard - Quinchool" };

export default function Home() {
  return <DashboardHome />;
}
