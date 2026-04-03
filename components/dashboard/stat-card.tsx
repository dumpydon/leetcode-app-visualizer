import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
}) {
  return (
    <Card className="animate-fade-up">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
        <div className="rounded-2xl bg-muted p-2">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div>{value}</div>
        {hint ? <div className="mt-2 text-sm text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}
