"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartShell } from "@/components/dashboard/chart-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const colors = [
  "#ef4444",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#2563eb",
];
const TOTAL_BACKGROUND_SCALE = 0.5;
const VISUAL_BAR_SCALE = 2;
const CHART_Y_MAX = 300;

function RatingBandBar(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: {
    band: string;
    solved: number;
    total: number;
    chartTotal: number;
    fillColor: string;
  };
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;

  if (!payload || width <= 0 || height <= 0) {
    return null;
  }

  const solvedHeight =
    payload.total > 0
      ? Math.min(
          Math.max((payload.solved / payload.total) * height * VISUAL_BAR_SCALE, payload.solved > 0 ? 4 : 0),
          height
        )
      : 0;
  const totalBackgroundHeight = Math.min(height * TOTAL_BACKGROUND_SCALE * VISUAL_BAR_SCALE, height);
  const totalBackgroundY = y + height - totalBackgroundHeight;
  const solvedWidth = Math.max(width * 0.68, 8);
  const solvedX = x + (width - solvedWidth) / 2;
  const solvedY = y + height - solvedHeight;

  return (
    <g>
      <Rectangle
        x={x}
        y={totalBackgroundY}
        width={width}
        height={totalBackgroundHeight}
        radius={[10, 10, 0, 0]}
        fill="rgba(226, 232, 240, 0.28)"
      />
      {solvedHeight > 0 ? (
        <Rectangle
          x={solvedX}
          y={solvedY}
          width={solvedWidth}
          height={solvedHeight}
          radius={[10, 10, 0, 0]}
          fill={payload.fillColor}
        />
      ) : null}
    </g>
  );
}

export function RatingDistributionChart({
  data,
  exact,
}: {
  data: Array<{
    band: string;
    solved: number;
    total: number;
    remaining: number;
    coverage: number;
  }>;
  exact: boolean;
}) {
  const chartData = data.map((item, index) => {
    const chartTotal = Math.max(
      item.band === "Unavailable"
        ? CHART_Y_MAX
        : Math.round(item.total),
      item.total > 0 ? 1 : 0
    );

    return {
      ...item,
      chartTotal,
      fillColor: colors[index % colors.length],
    };
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Problem Rating Distribution</CardTitle>
        <CardDescription>
          Click a band to open the problem explorer. {exact ? "Solved counts are exact." : "Solved counts are best-effort from public data."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartShell heightClassName="h-[460px]">
          <div className="h-[460px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 36 }} barCategoryGap={12}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="band"
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={90}
                  fontSize={12}
                />
                <YAxis tickLine={false} axisLine={false} domain={[0, CHART_Y_MAX]} width={44} />
                <Tooltip
                  formatter={(_, __, item) => {
                    const payload = item.payload as (typeof chartData)[number];
                    return [`${payload.solved} solved / ${payload.total} total`, payload.band];
                  }}
                />
                <Bar dataKey="chartTotal" shape={<RatingBandBar />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {data.map((item) => (
            <Link
              key={item.band}
              href={`/problems?band=${encodeURIComponent(item.band)}`}
              className="rounded-2xl border p-4 transition hover:bg-muted/50"
            >
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{item.band}</div>
              <div className="mt-2 text-lg font-semibold">
                {item.solved} / {item.total}
              </div>
              <div className="text-sm text-muted-foreground">{item.coverage}% coverage</div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
