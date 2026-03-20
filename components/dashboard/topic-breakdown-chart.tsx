"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartShell } from "@/components/dashboard/chart-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TopicBreakdownChart({
  data,
}: {
  data: Array<{ topic: string; solved: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Topic Weakness Analyzer</CardTitle>
        <CardDescription>Top solved tags from your current dataset.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartShell heightClassName="h-[320px]">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={data}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis dataKey="topic" type="category" width={120} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="solved" fill="hsl(var(--chart-2))" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>
      </CardContent>
    </Card>
  );
}
