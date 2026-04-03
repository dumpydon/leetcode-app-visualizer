"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import {
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeatmapDay } from "@/lib/types";
import { clamp, formatUtcDateKey } from "@/lib/utils";

type DailyItem = {
  date: string;
  easy: number;
  medium: number;
  hard: number;
  total: number;
  problems: HeatmapDay["problems"];
};

type AnchorRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

function difficultyMeta(difficulty: string | null) {
  if (difficulty === "Easy") {
    return { label: "Easy", color: "#00B8A3" };
  }

  if (difficulty === "Hard") {
    return { label: "Hard", color: "#FF375F" };
  }

  return { label: "Med", color: "#FFC01E" };
}

function getAnchorRect(node?: HTMLElement | null): AnchorRect | null {
  if (!node) {
    return null;
  }

  const rect = node.getBoundingClientRect();
  return {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
  };
}

export function DailySolvesTracker({ items }: { items: DailyItem[] }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState<{ item: DailyItem; anchor: AnchorRect } | null>(null);

  useEffect(() => {
    setIsClient(true);
    setViewport({ width: window.innerWidth, height: window.innerHeight });

    function handleResize() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setHovered(null);
      closeTimerRef.current = null;
    }, 120);
  }

  function openRowHover(item: DailyItem, node: HTMLElement | null) {
    clearCloseTimer();
    const anchor = getAnchorRect(node);

    if (!anchor) {
      return;
    }

    setHovered({ item, anchor });
  }

  function handleRowMouseEnter(item: DailyItem, event: ReactMouseEvent<HTMLDivElement>) {
    openRowHover(item, event.currentTarget);
  }

  function handleRowFocus(item: DailyItem, event: ReactFocusEvent<HTMLDivElement>) {
    openRowHover(item, event.currentTarget);
  }

  const panelStyle = useMemo(() => {
    if (!hovered || !viewport.width || !viewport.height) {
      return null;
    }

    const panelWidth = Math.min(530, viewport.width - 16);
    let left = hovered.anchor.right + 12;
    if (left + panelWidth > viewport.width - 8) {
      left = hovered.anchor.left - panelWidth - 12;
    }
    left = clamp(left, 8, Math.max(8, viewport.width - panelWidth - 8));

    const panelHeight = Math.min(630, viewport.height - 24);
    let top = hovered.anchor.top - 8;
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
  }, [hovered, viewport.height, viewport.width]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Solves Tracker</CardTitle>
        <CardDescription>E: easy, M: medium, H: hard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const isActive = hovered?.item.date === item.date;

          return (
            <div
              key={item.date}
              role="button"
              tabIndex={0}
              onMouseEnter={(event) => handleRowMouseEnter(item, event)}
              onMouseLeave={scheduleClose}
              onFocus={(event) => handleRowFocus(item, event)}
              onBlur={scheduleClose}
              aria-label={`Show solved problems for ${formatUtcDateKey(item.date)}`}
              className={`group relative flex items-center justify-between overflow-hidden rounded-2xl border px-4 py-3 transition duration-300 ${
                isActive
                  ? "border-fuchsia-400/35 bg-slate-900/85 shadow-[0_16px_38px_-24px_rgba(217,70,239,0.55)]"
                  : "border-white/10 bg-white/[0.02] hover:-translate-y-0.5 hover:border-fuchsia-400/30 hover:bg-slate-900/80 hover:shadow-[0_16px_38px_-24px_rgba(217,70,239,0.45)]"
              }`}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-fuchsia-400 via-violet-400 to-sky-400" />
                <div className="absolute -left-12 top-0 h-full w-40 -skew-x-12 bg-gradient-to-r from-fuchsia-400/0 via-fuchsia-300/12 to-sky-300/0 blur-xl transition duration-500 group-hover:translate-x-[360px] group-focus-visible:translate-x-[360px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_34%)]" />
              </div>

              <div className="relative">
                <div className="font-medium">{formatUtcDateKey(item.date)}</div>
                <div className="text-sm text-muted-foreground">
                  E:{item.easy} M:{item.medium} H:{item.hard}
                </div>
              </div>
              <Badge variant="outline" className="relative">
                {item.total} solved
              </Badge>
            </div>
          );
        })}
      </CardContent>

      {isClient && hovered && panelStyle
        ? createPortal(
            <div
              ref={panelRef}
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleClose}
              className="fixed z-[9999] rounded-2xl border border-white/15 bg-slate-950/95 p-4 shadow-2xl backdrop-blur"
              style={{
                left: panelStyle.left,
                top: panelStyle.top,
                width: panelStyle.width,
                maxHeight: panelStyle.maxHeight,
                pointerEvents: "auto",
              }}
            >
              <div className="text-base font-semibold">{formatUtcDateKey(hovered.item.date)}</div>
              <div className="mt-1 mb-[10px] text-sm font-medium">
                {hovered.item.total} problems solved
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className="rounded-md px-[10px] py-1 text-xs font-semibold"
                  style={{ color: "#00B8A3", background: "rgba(0,184,163,0.12)" }}
                >
                  Easy {hovered.item.easy}
                </span>
                <span
                  className="rounded-md px-[10px] py-1 text-xs font-semibold"
                  style={{ color: "#FFC01E", background: "rgba(255,192,30,0.12)" }}
                >
                  Medium {hovered.item.medium}
                </span>
                <span
                  className="rounded-md px-[10px] py-1 text-xs font-semibold"
                  style={{ color: "#FF375F", background: "rgba(255,55,95,0.12)" }}
                >
                  Hard {hovered.item.hard}
                </span>
              </div>

              <div className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Solved Problems
              </div>

              <div
                className="mt-3 space-y-[6px] overflow-y-auto pr-1"
                style={{ maxHeight: Math.max(180, panelStyle.maxHeight - 146) }}
              >
                {hovered.item.problems.length ? (
                  hovered.item.problems.map((problem, index) => {
                    const meta = difficultyMeta(problem.difficulty);

                    return (
                      <Link
                        key={`${problem.frontendId ?? "unknown"}-${problem.title}-${index}`}
                        href={problem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-[10px] border border-white/10 bg-white/[0.02] px-4 py-3 transition-all duration-150 hover:border-[rgba(34,211,238,0.45)] hover:bg-[rgba(34,211,238,0.08)]"
                        style={{ transition: "all 0.15s ease" }}
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
    </Card>
  );
}
