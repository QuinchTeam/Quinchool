import { Suspense } from "react";

import { DashboardGreeting } from "@/features/dashboard/components/dashboard-greeting";
import {
  DashboardHome,
  DashboardSkeleton,
} from "@/features/dashboard/components/dashboard-home";

export function DashboardPage() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-8 p-6">
      <DashboardGreeting />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardHome />
      </Suspense>
    </div>
  );
}
