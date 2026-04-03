"use client";

import Link from "next/link";
import { type MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeatmapDay } from "@/lib/types";
import { clamp, formatUtcDateKey } from "@/lib/utils";

const TILE_SIZE = 16;
const TILE_GAP = 3;
const GRID_ROWS = 7;
const TOOLTIP_WIDTH = 180;
const TOOLTIP_HEIGHT = 96;
const PANEL_WIDTH = 530;
const PANEL_MAX_HEIGHT = 630;
const PANEL_OFFSET = 12;
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type DayCell = {
  dateKey: string;
  utcDate: Date;
  total: number;
  easy: number;
  medium: number;
  hard: number;
  problems: HeatmapDay["problems"];
};

type HeatmapColumn = {
  kind: "days" | "separator";
  monthLabel?: string;
  cells: Array<DayCell | null>;
};

type HoveredTile = {
  day: DayCell;
  columnIndex: number;
  rowIndex: number;
};

type AnchorRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type PinnedTile = {
  day: DayCell;
  anchor: AnchorRect;
};

function tileColor(total: number) {
  if (total <= 0) return "#2b2b2b";
  if (total === 1) return "#0e4429";
  if (total === 2) return "#006d32";
  if (total === 3) return "#26a641";
  return "#39d353";
}

function difficultyMeta(difficulty: string | null) {
  if (difficulty === "Easy") {
    return { label: "Easy", color: "#00B8A3" };
  }

  if (difficulty === "Hard") {
    return { label: "Hard", color: "#FF375F" };
  }

  return { label: "Med", color: "#FFC01E" };
}

export function SolveHeatmap({ data }: { data: HeatmapDay[] }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const byDate = useMemo(() => new Map(data.map((item) => [item.date, item])), [data]);

  const columns = useMemo(() => {
    const now = new Date();
    const todayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    const days = Array.from({ length: 365 }, (_, index) => {
      const offset = 364 - index;
      const utcDate = new Date(todayUtc);
      utcDate.setUTCDate(todayUtc.getUTCDate() - offset);
      const dateKey = utcDate.toISOString().slice(0, 10);
      const item = byDate.get(dateKey);

      return {
        dateKey,
        utcDate,
        total: item?.total ?? 0,
        easy: item?.easy ?? 0,
        medium: item?.medium ?? 0,
        hard: item?.hard ?? 0,
        problems: item?.problems ?? [],
      } satisfies DayCell;
    });

    const built: HeatmapColumn[] = [];
    let currentCells: Array<DayCell | null> = Array.from({ length: GRID_ROWS }, () => null);
    let columnHasData = false;
    let pendingMonthLabel: string | undefined =
      days.length > 0 ? MONTH_FORMATTER.format(days[0].utcDate) : undefined;

    for (let index = 0; index < days.length; index += 1) {
      const day = days[index];
      const prevDay = index > 0 ? days[index - 1] : null;
      const monthChanged =
        prevDay !== null && day.utcDate.getUTCMonth() !== prevDay.utcDate.getUTCMonth();
      const isSunday = day.utcDate.getUTCDay() === 0;

      if (monthChanged) {
        if (columnHasData) {
          built.push({
            kind: "days",
            monthLabel: pendingMonthLabel,
            cells: currentCells,
          });
          pendingMonthLabel = undefined;
        }

        built.push({
          kind: "separator",
          cells: Array.from({ length: GRID_ROWS }, () => null),
        });

        currentCells = Array.from({ length: GRID_ROWS }, () => null);
        columnHasData = false;
        pendingMonthLabel = MONTH_FORMATTER.format(day.utcDate);
      } else if (isSunday && columnHasData) {
        built.push({
          kind: "days",
          monthLabel: pendingMonthLabel,
          cells: currentCells,
        });
        currentCells = Array.from({ length: GRID_ROWS }, () => null);
        columnHasData = false;
        pendingMonthLabel = undefined;
      }

      const rowIndex = day.utcDate.getUTCDay();
      currentCells[rowIndex] = day;
      columnHasData = true;
    }

    if (columnHasData) {
      built.push({
        kind: "days",
        monthLabel: pendingMonthLabel,
        cells: currentCells,
      });
    }

    return built;
  }, [byDate]);

  const gridWidth = columns.length * TILE_SIZE + Math.max(0, columns.length - 1) * TILE_GAP;
  const gridHeight = GRID_ROWS * TILE_SIZE + (GRID_ROWS - 1) * TILE_GAP;

  const [hovered, setHovered] = useState<HoveredTile | null>(null);
  const [pinned, setPinned] = useState<PinnedTile | null>(null);

  useEffect(() => {
    setIsClient(true);
    setViewport({ width: window.innerWidth, height: window.innerHeight });

    function onResize() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const panelStyle = useMemo(() => {
    if (!pinned || !viewport.width || !viewport.height) {
      return null;
    }

    const panelWidth = Math.min(PANEL_WIDTH, viewport.width - 16);
    let left = pinned.anchor.right + PANEL_OFFSET;
    if (left + panelWidth > viewport.width - 8) {
      left = pinned.anchor.left - panelWidth - PANEL_OFFSET;
    }
    left = clamp(left, 8, Math.max(8, viewport.width - panelWidth - 8));

    const panelHeight = Math.min(PANEL_MAX_HEIGHT, viewport.height - 24);
    let top = pinned.anchor.top - 8;
    if (top + panelHeight > viewport.height - 8) {
      top = viewport.height - panelHeight - 8;
    }
    top = clamp(top, 8, Math.max(8, viewport.height - panelHeight - 8));

    return {
      left,
      top,
      width: panelWidth,
      maxHeight: panelHeight,
    };
  }, [pinned, viewport.height, viewport.width]);

  useEffect(() => {
    if (!pinned) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      if (target.closest("[data-heatmap-tile='true']")) {
        return;
      }

      if (panelRef.current?.contains(target)) {
        return;
      }

      setPinned(null);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [pinned]);

  function getAnchorRect(tile?: HTMLElement | null): AnchorRect | null {
    if (!tile) {
      return null;
    }

    const rect = tile.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
    };
  }

  function handleTileClick(day: DayCell, event: ReactMouseEvent<HTMLButtonElement>) {
    const anchor = getAnchorRect(event.currentTarget);

    if (!anchor) {
      return;
    }

    setPinned((current) =>
      current?.day.dateKey === day.dateKey
        ? null
        : {
            day,
            anchor,
          }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submissions Heatmap</CardTitle>
        <CardDescription>LeetCode-style 365 day activity view (UTC grouped).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <div className="w-full overflow-x-auto scroll-smooth">
            <div className="flex w-max min-w-full flex-col">
              <div className="flex items-start gap-3">
                <div className="grid text-[10px] text-muted-foreground" style={{ rowGap: TILE_GAP }}>
                  {WEEKDAY_LABELS.map((label) => (
                    <div
                      key={label}
                      className="flex items-center"
                      style={{ height: TILE_SIZE }}
                    >
                      {label}
                    </div>
                  ))}
                </div>

                  <div className="relative pb-1">
                    <div className="flex" style={{ columnGap: TILE_GAP }}>
                      {columns.map((column, columnIndex) => (
                        <div
                        key={`column-${columnIndex}`}
                        className="grid"
                        style={{ rowGap: TILE_GAP }}
                      >
                        {column.cells.map((day, rowIndex) => {
                          if (column.kind === "separator") {
                            return (
                              <div
                              key={`separator-${columnIndex}-${rowIndex}`}
                              style={{
                                width: TILE_SIZE,
                                height: TILE_SIZE,
                                borderRadius: 3,
                                opacity: 0,
                              }}
                            />
                            );
                          }

                          if (!day) {
                            return (
                              <div
                                key={`blank-${columnIndex}-${rowIndex}`}
                                style={{
                                  width: TILE_SIZE,
                                  height: TILE_SIZE,
                                  borderRadius: 3,
                                  opacity: 0,
                                }}
                              />
                            );
                          }

                          const isPinned = pinned?.day.dateKey === day.dateKey;

                          return (
                            <button
                              key={day.dateKey}
                              type="button"
                              data-heatmap-tile="true"
                              aria-label={`${formatUtcDateKey(day.dateKey)}: ${day.total} solved`}
                              onMouseEnter={() => setHovered({ day, columnIndex, rowIndex })}
                              onMouseLeave={() => setHovered(null)}
                              onFocus={() => setHovered({ day, columnIndex, rowIndex })}
                              onBlur={() => setHovered(null)}
                              onClick={(event) => handleTileClick(day, event)}
                              className="transition-transform duration-150 hover:scale-[1.08] focus-visible:scale-[1.08] focus-visible:outline-none"
                              style={{
                                width: TILE_SIZE,
                                height: TILE_SIZE,
                                borderRadius: 3,
                                backgroundColor: tileColor(day.total),
                                boxShadow: isPinned
                                  ? "0 0 0 2px rgba(57,211,83,0.75)"
                                  : "none",
                              }}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {hovered ? (
                    <div
                      className="pointer-events-none absolute z-20 rounded-lg border border-white/15 bg-slate-950/95 px-3 py-2 text-xs text-slate-100 shadow-xl transition-opacity duration-150"
                      style={{
                        width: TOOLTIP_WIDTH,
                        left: clamp(
                          hovered.columnIndex * (TILE_SIZE + TILE_GAP) - TOOLTIP_WIDTH / 2,
                          0,
                          Math.max(0, gridWidth - TOOLTIP_WIDTH)
                        ),
                        top: clamp(
                          hovered.rowIndex * (TILE_SIZE + TILE_GAP) - TOOLTIP_HEIGHT - 8,
                          0,
                          Math.max(0, gridHeight - TOOLTIP_HEIGHT)
                        ),
                        animation: "fadeTooltip 120ms ease-out",
                      }}
                    >
                      <div className="font-semibold">{formatUtcDateKey(hovered.day.dateKey)}</div>
                      <div className="mt-1">{hovered.day.total} problems solved</div>
                      <div>Easy: {hovered.day.easy}</div>
                      <div>Medium: {hovered.day.medium}</div>
                      <div>Hard: {hovered.day.hard}</div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <div className="w-9" />
                <div className="flex" style={{ columnGap: TILE_GAP }}>
                  {columns.map((column, index) => (
                    <div
                      key={`label-${index}`}
                      className="text-[11px] text-muted-foreground"
                      style={{ width: TILE_SIZE }}
                    >
                      {column.kind === "days" ? column.monthLabel ?? "" : ""}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {isClient && pinned && panelStyle
          ? createPortal(
              <div
                ref={panelRef}
                className="fixed z-[9999] rounded-2xl border border-white/15 bg-slate-950/95 p-4 shadow-2xl backdrop-blur"
                style={{
                  left: panelStyle.left,
                  top: panelStyle.top,
                  width: panelStyle.width,
                  maxHeight: panelStyle.maxHeight,
                  pointerEvents: "auto",
                }}
              >
                <div className="text-base font-semibold">{formatUtcDateKey(pinned.day.dateKey)}</div>
                <div
                  className="mt-1 mb-[10px]"
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {pinned.day.total} problems solved
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span
                    className="rounded-md px-[10px] py-1 text-xs font-semibold"
                    style={{
                      color: "#00B8A3",
                      background: "rgba(0,184,163,0.12)",
                    }}
                  >
                    Easy {pinned.day.easy}
                  </span>
                  <span
                    className="rounded-md px-[10px] py-1 text-xs font-semibold"
                    style={{
                      color: "#FFC01E",
                      background: "rgba(255,192,30,0.12)",
                    }}
                  >
                    Medium {pinned.day.medium}
                  </span>
                  <span
                    className="rounded-md px-[10px] py-1 text-xs font-semibold"
                    style={{
                      color: "#FF375F",
                      background: "rgba(255,55,95,0.12)",
                    }}
                  >
                    Hard {pinned.day.hard}
                  </span>
                </div>

                <div className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Solved Problems
                </div>

                <div
                  className="mt-3 space-y-[6px] overflow-y-auto pr-1"
                  style={{ maxHeight: Math.max(180, panelStyle.maxHeight - 126) }}
                >
                  {pinned.day.problems.length ? (
                    pinned.day.problems.map((problem, index) => {
                      const meta = difficultyMeta(problem.difficulty);

                      return (
                        <Link
                          key={`${problem.frontendId ?? "unknown"}-${problem.title}-${index}`}
                          href={problem.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-[10px] border border-white/10 bg-white/[0.02] px-4 py-3 transition-all duration-150 hover:border-[rgba(34,211,238,0.45)] hover:bg-[rgba(34,211,238,0.08)]"
                          style={{
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold" style={{ color: meta.color }}>
                              [{meta.label}]
                            </span>
                            <span
                              style={{
                                fontSize: "15px",
                                fontWeight: 600,
                                lineHeight: 1.4,
                                color: "#FFFFFF",
                              }}
                            >
                              {problem.frontendId ? `#${problem.frontendId} ` : ""}
                              {problem.title}
                            </span>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-white/20 px-3 py-3 text-sm text-muted-foreground">
                      No accepted solves recorded for this day.
                    </div>
                  )}
                </div>
              </div>,
              document.body
            )
          : null}
      </CardContent>
    </Card>
  );
}
