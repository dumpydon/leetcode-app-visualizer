"use client";

import { Bookmark, ChevronDown, CircleDot, RotateCcw } from "lucide-react";

import { ProblemRow } from "@/components/problems/problem-row";
import { RatingProgressBar } from "@/components/problems/rating-progress-bar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { ExplorerGroup } from "./explorer-types";

function AnalyticsChip({
  label,
  value,
  className,
}: {
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted/45 px-2.5 py-1 text-xs text-muted-foreground", className)}>
      <span>{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}

export function RatingGroup({
  group,
  expanded,
  search,
  onToggle,
}: {
  group: ExplorerGroup;
  expanded: boolean;
  search: string;
  onToggle: () => void;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-card/45 transition-all duration-200",
        expanded ? "border-primary/30 shadow-[0_18px_50px_-38px_rgba(56,189,248,0.7)]" : "hover:-translate-y-0.5 hover:border-border/90 hover:bg-card/70"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full px-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", !expanded && "-rotate-90")} />
              <span className="text-lg font-semibold tracking-tight">{group.band}</span>
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{group.solved}</span> / {group.total} solved
              </span>
            </div>
            <div className="mt-3 flex max-w-xl items-center gap-3">
              <div className="min-w-0 flex-1">
                <RatingProgressBar value={group.coverage} />
              </div>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {group.coverage.toFixed(0)}% complete
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <AnalyticsChip label="Easy" value={group.easy} className="border-[#00B8A3]/20 text-[#00B8A3]" />
            <AnalyticsChip label="Medium" value={group.medium} className="border-[#FFC01E]/20 text-[#FFC01E]" />
            <AnalyticsChip label="Hard" value={group.hard} className="border-[#FF375F]/20 text-[#FF375F]" />
            <AnalyticsChip label="Problems" value={group.total} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CircleDot className="h-3.5 w-3.5" />{group.remaining} remaining</span>
          <span className="inline-flex items-center gap-1.5"><Bookmark className="h-3.5 w-3.5" />{group.bookmarked} saved</span>
          <span className="inline-flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" />{group.revisit} revisit</span>
          <span className="inline-flex items-center gap-1.5"><Badge variant="outline" className="px-2 py-0.5">Review later {group.reviewLater}</Badge></span>
        </div>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0 overflow-hidden border-t">
          {expanded ? (
            <div className="divide-y divide-border/70">
              {group.items.map((item) => (
                <ProblemRow key={item.slug} item={item} search={search} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
