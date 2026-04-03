"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
const TOTAL_BAR_VISUAL_SCALE = 2;
const SOLVED_BAR_VISUAL_SCALE = 1.5;
const CHART_Y_MAX = 300;

function getActivePayload(
  state: unknown
): {
  band: string;
} | null {
  const candidate = state as {
    activePayload?: Array<{
      payload?: {
        band?: string;
      };
    }>;
  } | null;

  const payload = candidate?.activePayload?.[0]?.payload;

  if (!payload?.band) {
    return null;
  }

  return { band: payload.band };
}

function RatingTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      band: string;
      solved: number;
      total: number;
    };
  }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0].payload;
  const coverage = data.total > 0 ? ((data.solved / data.total) * 100).toFixed(2) : "0.00";

  return (
    <div className="min-w-[180px] space-y-3 rounded-2xl border bg-card/95 p-4 text-sm shadow-2xl backdrop-blur">
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Rating Range
        </div>
        <div className="mt-1 text-base font-semibold">{data.band}</div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Solved
        </div>
        <div className="mt-1 text-lg font-semibold">{data.solved}</div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Total Problems
        </div>
        <div className="mt-1 text-lg font-semibold">{data.total}</div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Coverage
        </div>
        <div className="mt-1 text-lg font-semibold">{coverage}%</div>
      </div>
    </div>
  );
}

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
    isActive: boolean;
    isDimmed: boolean;
  };
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;

  if (!payload || width <= 0 || height <= 0) {
    return null;
  }

  const solvedHeight =
    payload.total > 0
      ? Math.min(
          Math.max(
            (payload.solved / payload.total) * height * SOLVED_BAR_VISUAL_SCALE,
            payload.solved > 0 ? 4 : 0
          ),
          height
        )
      : 0;
  const totalBackgroundHeight = Math.min(
    height * TOTAL_BACKGROUND_SCALE * TOTAL_BAR_VISUAL_SCALE,
    height
  );
  const totalBackgroundY = y + height - totalBackgroundHeight;
  const solvedWidth = Math.max(width * 0.68, 8);
  const solvedX = x + (width - solvedWidth) / 2;
  const solvedY = y + height - solvedHeight;
  const totalOpacity = payload.isDimmed ? 0.18 : payload.isActive ? 0.52 : 0.28;
  const solvedOpacity = payload.isDimmed ? 0.4 : 1;

  return (
    <g>
      <Rectangle
        x={x}
        y={totalBackgroundY}
        width={width}
        height={totalBackgroundHeight}
        radius={[10, 10, 0, 0]}
        fill={`rgba(226, 232, 240, ${totalOpacity})`}
      />
      {solvedHeight > 0 ? (
        <Rectangle
          x={solvedX}
          y={solvedY}
          width={solvedWidth}
          height={solvedHeight}
          radius={[10, 10, 0, 0]}
          fill={payload.fillColor}
          fillOpacity={solvedOpacity}
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
  const router = useRouter();
  const [hoveredBand, setHoveredBand] = useState<string | null>(null);

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
      isActive: hoveredBand === item.band,
      isDimmed: hoveredBand !== null && hoveredBand !== item.band,
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
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 8, left: 0, bottom: 36 }}
                barCategoryGap={12}
                onMouseLeave={() => setHoveredBand(null)}
                onMouseMove={(state) => {
                  const active = getActivePayload(state);
                  setHoveredBand(active?.band ?? null);
                }}
                onClick={(state) => {
                  const active = getActivePayload(state);

                  if (active?.band) {
                    router.push(`/problems?band=${encodeURIComponent(active.band)}`);
                  }
                }}
              >
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
                <Tooltip cursor={false} content={<RatingTooltip />} />
                <Bar dataKey="chartTotal" shape={<RatingBandBar />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>
      </CardContent>
    </Card>
  );
}
