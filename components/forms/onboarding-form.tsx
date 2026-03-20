import { savePrimaryUserAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingForm() {
  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle className="text-3xl">Set up your dashboard</CardTitle>
        <CardDescription>
          Start with your LeetCode username. The app will sync public profile data immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={savePrimaryUserAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">LeetCode username</Label>
            <Input id="username" name="username" placeholder="your-handle" required />
          </div>
          <Button type="submit" className="w-full">
            Create dashboard
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
