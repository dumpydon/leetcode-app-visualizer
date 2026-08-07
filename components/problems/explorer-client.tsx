"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { ExplorerFilters } from "@/components/problems/explorer-filters";
import { buildExplorerGroups } from "@/components/problems/explorer-types";
import { RatingExplorer } from "@/components/problems/rating-explorer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProblemCardData } from "@/lib/types";

type ExplorerResponse = {
  isExact: boolean;
  items: ProblemCardData[];
};

export function ExplorerClient({ initialBand }: { initialBand?: string }) {
  const [band, setBand] = useState(initialBand ?? "All");
  const [difficulty, setDifficulty] = useState("All");
  const [solved, setSolved] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedBand, setExpandedBand] = useState<string | null>(
    initialBand && initialBand !== "All" ? initialBand : null
  );

  const query = useQuery({
    queryKey: ["problems", band, difficulty, solved, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (band !== "All") params.set("band", band);
      if (difficulty !== "All") params.set("difficulty", difficulty);
      if (solved !== "All") params.set("solved", solved === "Solved" ? "solved" : "remaining");
      if (search) params.set("search", search);

      const response = await fetch(`/api/problems?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load problems.");
      }

      return (await response.json()) as ExplorerResponse;
    },
  });

  const groups = useMemo(() => buildExplorerGroups(query.data?.items ?? []), [query.data?.items]);
  const displayedGroups = useMemo(() => groups.filter((group) => group.total >= 5), [groups]);
  const summary = useMemo(() => {
    const total = query.data?.items.length ?? 0;
    const solvedCount = query.data?.items.filter((item) => item.solved).length ?? 0;
    return { total, solvedCount, remainingCount: total - solvedCount };
  }, [query.data?.items]);

  useEffect(() => {
    if (!search.trim() || !displayedGroups.length) {
      return;
    }

    setExpandedBand((current) => (current === displayedGroups[0].band ? current : displayedGroups[0].band));
  }, [displayedGroups, search]);

  function handleBandChange(value: string) {
    setBand(value);
    if (value !== "All") {
      setExpandedBand(value);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-2">
          <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Problem library</div>
          <CardTitle className="text-2xl">Rating Explorer</CardTitle>
          <CardDescription>
            Explore your solved, remaining, and saved problems by Zerotrac rating band.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExplorerFilters
            band={band}
            difficulty={difficulty}
            solved={solved}
            search={search}
            onBandChange={handleBandChange}
            onDifficultyChange={setDifficulty}
            onSolvedChange={setSolved}
            onSearchChange={setSearch}
          />
        </CardContent>
      </Card>

      {query.isPending ? (
        <div className="space-y-3" aria-label="Loading problem groups">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl border bg-muted/30" />
          ))}
        </div>
      ) : null}

      {query.isError ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 px-6 py-8 text-sm text-muted-foreground">
          Could not load problems. Please try again.
        </div>
      ) : null}

      {query.data ? (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline">{summary.solvedCount} solved</Badge>
            <Badge variant="outline">{summary.remainingCount} remaining</Badge>
            <Badge variant="outline">{summary.total} filtered problems</Badge>
            <Badge variant={query.data.isExact ? "success" : "outline"}>
              {query.data.isExact ? "Exact solved set" : "Public-mode approximation"}
            </Badge>
          </div>

          <RatingExplorer
            groups={displayedGroups}
            expandedBand={expandedBand}
            search={search}
            onExpandedBandChange={setExpandedBand}
          />
        </>
      ) : null}
    </div>
  );
}
