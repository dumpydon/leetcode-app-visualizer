import { AppShell } from "@/components/layout/app-shell";
import { ExplorerClient } from "@/components/problems/explorer-client";

export const dynamic = "force-dynamic";

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams?: Promise<{ band?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell activePath="/problems">
      <ExplorerClient initialBand={params?.band} />
    </AppShell>
  );
}
