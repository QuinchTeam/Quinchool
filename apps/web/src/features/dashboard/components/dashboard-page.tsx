import { DashboardGreeting } from "@/features/dashboard/components/dashboard-greeting";
import { DashboardStats } from "@/features/dashboard/components/dashboard-stats";
import { JumpBackIn } from "@/features/dashboard/components/jump-back-in";
import { NewJobMatches } from "@/features/dashboard/components/new-job-matches";
import { RecentTransactions } from "@/features/dashboard/components/recent-transactions";

export function DashboardPage() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-8 p-6">
      <DashboardGreeting />
      <DashboardStats />
      <div className="grid gap-4 lg:grid-cols-2">
        <RecentTransactions />
        <NewJobMatches />
      </div>
      <JumpBackIn />
    </div>
  );
}
