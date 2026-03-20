import { AppShell } from "@/components/layout/app-shell";
import { PracticePanel } from "@/components/recommendations/practice-panel";
import { getDashboardStats } from "@/lib/services/analytics-service";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const stats = await getDashboardStats();

  return (
    <AppShell activePath="/recommendations">
      <PracticePanel
        initialItems={stats?.recommendations ?? []}
        exact={stats?.user.hasExactSolvedData ?? false}
      />
    </AppShell>
  );
}
