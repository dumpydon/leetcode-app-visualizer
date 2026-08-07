"use client";

import { RatingGroup } from "@/components/problems/rating-group";

import { ExplorerGroup } from "./explorer-types";

export function RatingExplorer({
  groups,
  expandedBand,
  search,
  onExpandedBandChange,
}: {
  groups: ExplorerGroup[];
  expandedBand: string | null;
  search: string;
  onExpandedBandChange: (band: string | null) => void;
}) {
  if (!groups.length) {
    return (
      <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
        <div className="text-base font-medium">No problems match these filters.</div>
        <p className="mt-2 text-sm text-muted-foreground">Try widening the rating, difficulty, or progress filter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <RatingGroup
          key={group.band}
          group={group}
          expanded={expandedBand === group.band}
          search={search}
          onToggle={() => onExpandedBandChange(expandedBand === group.band ? null : group.band)}
        />
      ))}
    </div>
  );
}
