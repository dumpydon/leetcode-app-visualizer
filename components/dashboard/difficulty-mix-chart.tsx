"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartShell } from "@/components/dashboard/chart-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DIFFICULTY_META = {
  Easy: { color: "#00B8A3", text: "text-[#00B8A3]" },
  Medium: { color: "#FFC01E", text: "text-[#FFC01E]" },
  Hard: { color: "#FF375F", text: "text-[#FF375F]" },
} as const;

function DifficultyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: { difficulty: string; value: number; percent: number };
  }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload as { difficulty: string; value: number; percent: number } | undefined;

  if (!item) {
    return null;
  }

  return (
    <div className="rounded-2xl border bg-popover px-4 py-3 text-sm shadow-xl">
      <div className={`font-semibold ${DIFFICULTY_META[item.difficulty as keyof typeof DIFFICULTY_META]?.text ?? ""}`}>
        {item.difficulty}
      </div>
      <div className="mt-1 text-muted-foreground">
        {item.value} solved · {Math.round(item.percent)}%
      </div>
    </div>
  );
}

export function DifficultyMixChart({
  data,
  totalSolved,
  totalProblems,
}: {
  data: Array<{ difficulty: string; value: number; total: number }>;
  totalSolved: number;
  totalProblems: number;
}) {
  const solvedCompletion = totalProblems
    ? ((totalSolved / totalProblems) * 100).toFixed(2)
    : "0.00";

  const chartData = data.map((item) => ({
    ...item,
    percent: totalSolved ? (item.value / totalSolved) * 100 : 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Difficulty Mix</CardTitle>
        <CardDescription>Easy, medium, and hard solved distribution.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartShell heightClassName="h-[260px]">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="difficulty"
                  innerRadius={60}
                  outerRadius={90}
                  labelLine={false}
                  label={({ percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                    const safePercent = percent ?? 0;
                    const safeMidAngle = midAngle ?? 0;
                    const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
                    const x = Number(cx) + radius * Math.cos((-safeMidAngle * Math.PI) / 180);
                    const y = Number(cy) + radius * Math.sin((-safeMidAngle * Math.PI) / 180);

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#ffffff"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={18}
                        fontWeight={800}
                      >
                        {Math.round(safePercent)}%
                      </text>
                    );
                  }}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.difficulty}
                      fill={DIFFICULTY_META[entry.difficulty as keyof typeof DIFFICULTY_META]?.color ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip content={<DifficultyTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>
        <div className="grid gap-3 sm:grid-cols-3">
          {chartData.map((entry) => (
            <div key={entry.difficulty} className="rounded-2xl border px-4 py-3 text-center">
              <div className={`text-sm font-semibold ${DIFFICULTY_META[entry.difficulty as keyof typeof DIFFICULTY_META]?.text ?? ""}`}>
                {entry.difficulty}
              </div>
              <div className="mt-1 text-2xl font-semibold">{Math.round(entry.percent)}%</div>
              <div className="text-sm text-muted-foreground">
                {entry.value}/{entry.total} solved
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border px-4 py-4 text-center">
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Total Solved</div>
          <div className="mt-2 text-3xl font-semibold">
            {totalSolved} / {totalProblems}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{solvedCompletion}% solved</div>
        </div>
      </CardContent>
    </Card>
  );
}
