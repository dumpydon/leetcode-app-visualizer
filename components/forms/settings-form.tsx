import { updateSettingsAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsForm({
  user,
}: {
  user: {
    username: string;
    hasExactSolvedData: boolean;
    syncMessage?: string | null;
    leetcodeSession?: string | null;
    leetcodeCsrfToken?: string | null;
  };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>
          Public sync works with just your username. Add session cookies if you want exact solved and unsolved analytics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant={user.hasExactSolvedData ? "success" : "outline"}>
            {user.hasExactSolvedData ? "Exact mode enabled" : "Public mode only"}
          </Badge>
        </div>
        {user.syncMessage ? (
          <div className="rounded-2xl border border-border/80 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            {user.syncMessage}
          </div>
        ) : null}
        <form action={updateSettingsAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Primary username</Label>
            <Input id="username" name="username" defaultValue={user.username} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leetcodeSession">LeetCode session cookie</Label>
            <Input
              id="leetcodeSession"
              name="leetcodeSession"
              defaultValue={user.leetcodeSession ?? ""}
              placeholder="Paste the value, LEETCODE_SESSION=..., or a full Cookie header"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leetcodeCsrfToken">CSRF token</Label>
            <Input
              id="leetcodeCsrfToken"
              name="leetcodeCsrfToken"
              defaultValue={user.leetcodeCsrfToken ?? ""}
              placeholder="Paste the value or csrftoken=..."
            />
          </div>
          <Button type="submit">Save and resync</Button>
        </form>
      </CardContent>
    </Card>
  );
}
