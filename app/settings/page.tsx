import { AppShell } from "@/components/layout/app-shell";
import { SettingsForm } from "@/components/forms/settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPrimaryUser } from "@/lib/services/users";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getPrimaryUser();

  return (
    <AppShell activePath="/settings">
      {user ? (
        <SettingsForm
          user={{
            username: user.username,
            hasExactSolvedData: user.hasExactSolvedData,
            syncMessage: user.syncMessage,
            leetcodeSession: user.leetcodeSession,
            leetcodeCsrfToken: user.leetcodeCsrfToken,
          }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No user configured</CardTitle>
          </CardHeader>
          <CardContent>Return to the dashboard and add your username first.</CardContent>
        </Card>
      )}
    </AppShell>
  );
}
