import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardGreeting } from "@/features/dashboard/components/dashboard-greeting";
import {
  DashboardHome,
  DashboardSkeleton,
} from "@/features/dashboard/components/dashboard-home";

export const metadata: Metadata = { title: "Dashboard - Quinchool" };

export default function Home() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-8 p-6">
      {/* The greeting needs no API data, so it shows while the tiles load. */}
      <DashboardGreeting />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardHome />
      </Suspense>
    </div>
  );
}
