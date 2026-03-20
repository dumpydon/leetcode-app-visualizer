"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { eachDayOfInterval, endOfMonth, format, startOfMonth, subMonths } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeatmapDay } from "@/lib/types";

const HEATMAP_SCALE = 2;
const BASE_CELL_SIZE = 12;
const BASE_GAP = 4;

function intensity(total: number) {
  if (total === 0) return "bg-muted";
  if (total <= 1) return "bg-emerald-200 dark:bg-emerald-950";
  if (total <= 3) return "bg-emerald-400 dark:bg-emerald-700";
  if (total <= 5) return "bg-emerald-500 dark:bg-emerald-500";
  return "bg-emerald-700 dark:bg-emerald-300";
}

function difficultyTone(difficulty: string | null) {
  if (difficulty === "Easy") {
    return {
      label: "Easy",
      text: "text-cyan-400",
      badge: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
      idBadge: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
    };
  }

  if (difficulty === "Hard") {
    return {
      label: "Hard",
      text: "text-rose-400",
      badge: "border-rose-400/30 bg-rose-500/10 text-rose-300",
      idBadge: "border-rose-400/25 bg-rose-500/10 text-rose-200",
    };
  }

  return {
    label: "Med.",
    text: "text-amber-400",
    badge: "border-amber-400/30 bg-amber-500/10 text-amber-300",
    idBadge: "border-amber-400/25 bg-amber-500/10 text-amber-200",
  };
}

export function SolveHeatmap({ data }: { data: HeatmapDay[] }) {
  const map = useMemo(() => new Map(data.map((item) => [item.date, item])), [data]);
  const months = Array.from({ length: 5 }).map((_, index) => subMonths(new Date(), 4 - index));
  const monthGroups = months.map((monthDate) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const realDays = eachDayOfInterval({ start: monthStart, end: monthEnd }).map((date) => ({
      key: format(date, "yyyy-MM-dd"),
      label: format(date, "MMM d, yyyy"),
    }));
    const leadingBlanks = monthStart.getDay();
    const trailingBlanks = (7 - ((leadingBlanks + realDays.length) % 7)) % 7;
    const paddedDays = [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...realDays,
      ...Array.from({ length: trailingBlanks }, () => null),
    ];
    const weeks = Array.from({ length: Math.ceil(paddedDays.length / 7) }).map((_, weekIndex) =>
      paddedDays.slice(weekIndex * 7, weekIndex * 7 + 7)
    );

    return {
      key: format(monthDate, "yyyy-MM"),
      label: format(monthDate, "MMM"),
      weeks,
    };
  });
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const initialKey =
    [...data]
      .sort((left, right) => right.date.localeCompare(left.date))
      .find((item) => item.total > 0)?.date ?? null;
  const [pinnedDayKey, setPinnedDayKey] = useState<string | null>(null);
  const [hoveredDayKey, setHoveredDayKey] = useState<string | null>(null);
  const activeDayKey = pinnedDayKey ?? hoveredDayKey ?? initialKey;
  const activeDay = (activeDayKey ? map.get(activeDayKey) : null) ?? null;
  const cellSize = BASE_CELL_SIZE * HEATMAP_SCALE;
  const gap = Math.max(2, BASE_GAP * HEATMAP_SCALE * 0.5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub Style Heatmap</CardTitle>
        <CardDescription>Daily solve activity across your latest 20 weeks.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[auto_minmax(320px,1fr)] xl:items-start">
          <div className="overflow-x-auto">
            <div className="inline-flex min-w-max gap-4">
              <div>
                <div
                  className="grid grid-rows-7 text-[10px] text-muted-foreground"
                  style={{ gap }}
                >
                  {weekdayLabels.map((label) => (
                    <div
                      key={label}
                      className="flex items-center"
                      style={{ height: cellSize }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-6">
                {monthGroups.map((month) => (
                  <div key={month.key} className="flex flex-col items-center gap-3">
                    <div className="flex" style={{ gap }}>
                      {month.weeks.map((week, weekIndex) => (
                        <div key={`${month.key}-${weekIndex}`} className="flex flex-col" style={{ gap }}>
                          {week.map((day, dayIndex) => {
                            if (!day) {
                              return (
                                <div
                                  key={`${month.key}-${weekIndex}-blank-${dayIndex}`}
                                  className="rounded-[6px] opacity-0"
                                  style={{ width: cellSize, height: cellSize }}
                                />
                              );
                            }

                            const item = map.get(day.key);
                            const isActive = day.key === activeDayKey;
                            const summary = item
                              ? `${day.label}: ${item.total} solves | E:${item.easy} M:${item.medium} H:${item.hard}`
                              : `${day.label}: 0 solves`;

                            return (
                              <button
                                key={day.key}
                                type="button"
                                aria-label={summary}
                                onMouseEnter={() => {
                                  if (!pinnedDayKey) {
                                    setHoveredDayKey(day.key);
                                  }
                                }}
                                onFocus={() => {
                                  if (!pinnedDayKey) {
                                    setHoveredDayKey(day.key);
                                  }
                                }}
                                onMouseLeave={() => {
                                  if (!pinnedDayKey) {
                                    setHoveredDayKey(null);
                                  }
                                }}
                                onClick={() => {
                                  setPinnedDayKey((current) => (current === day.key ? null : day.key));
                                  setHoveredDayKey(day.key);
                                }}
                                className={`rounded-[6px] transition-all ${intensity(item?.total ?? 0)} ${
                                  isActive
                                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                    : ""
                                }`}
                                style={{ width: cellSize, height: cellSize }}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="text-lg font-medium text-muted-foreground">{month.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-background/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">
                  {activeDayKey ? format(new Date(activeDayKey), "MMM d, yyyy") : "Select a day"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {activeDay
                    ? `${activeDay.total} solves | E:${activeDay.easy} M:${activeDay.medium} H:${activeDay.hard}`
                    : "Hover a cell to preview it, or click a cell to lock the day here."}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {pinnedDayKey ? <Badge variant="success">Pinned</Badge> : null}
                {activeDay ? <Badge variant="secondary">{activeDay.total} solved</Badge> : null}
              </div>
            </div>

            <div className="mt-4 h-[45rem] space-y-2 overflow-y-auto pr-2">
              {activeDay?.problems.length ? (
                activeDay.problems.map((problem, index) => (
                  <Link
                    key={`${problem.frontendId ?? "unknown"}-${problem.title}-${index}`}
                    href={problem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border px-3 py-3 text-sm transition-colors hover:border-primary hover:bg-accent/40"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                          difficultyTone(problem.difficulty).badge
                        }`}
                      >
                        {difficultyTone(problem.difficulty).label}
                      </span>
                      {problem.frontendId ? (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            difficultyTone(problem.difficulty).idBadge
                          }`}
                        >
                          #{problem.frontendId}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-foreground">
                      {problem.title}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border px-3 py-4 text-sm text-muted-foreground">
                  No accepted solves recorded for this day.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline">E:x</Badge>
          <Badge variant="outline">M:y</Badge>
          <Badge variant="outline">H:z</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
