"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, RefreshCcw, ShieldCheck, Target, TrendingUp } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReadinessPushCard } from "@/lib/types";

type ReadinessBand = {
  band: string;
  solved: number;
  total: number;
  remaining: number;
  coverage: number;
};

export function ReadinessMeter({
  score,
  bands,
  initialSuggestions,
  storageKey,
}: {
  score: number | null;
  bands: ReadinessBand[];
  initialSuggestions: ReadinessPushCard[];
  storageKey: string;
}) {
  const safeScore = score ?? 0;
  const targetSolved = bands.reduce((sum, band) => sum + band.solved, 0);
  const targetTotal = bands.reduce((sum, band) => sum + band.total, 0);
  const targetRemaining = Math.max(targetTotal - targetSolved, 0);
  const nextMilestone = [25, 40, 60, 75].find((value) => value > safeScore) ?? 90;
  const solvesForNext =
    targetTotal > 0
      ? Math.max(Math.ceil((targetTotal * nextMilestone) / 100) - targetSolved, 0)
      : 0;
  const weakestBand = [...bands].sort((left, right) => left.coverage - right.coverage)[0];
  const strongestBand = [...bands].sort((left, right) => right.coverage - left.coverage)[0];
  const [suggestions, setSuggestions] = useState<ReadinessPushCard[]>(initialSuggestions);
  const localStorageKey = useMemo(
    () => `readiness-push:${storageKey}`,
    [storageKey]
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(localStorageKey);

    if (stored) {
      try {
        setSuggestions(JSON.parse(stored) as ReadinessPushCard[]);
        return;
      } catch {
        window.localStorage.removeItem(localStorageKey);
      }
    }

    window.localStorage.setItem(localStorageKey, JSON.stringify(initialSuggestions));
    setSuggestions(initialSuggestions);
  }, [initialSuggestions, localStorageKey]);

  const reroll = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/readiness-push");

      if (!response.ok) {
        throw new Error("Failed to refresh readiness push recommendations.");
      }

      return (await response.json()) as { items: ReadinessPushCard[] };
    },
    onSuccess: (payload) => {
      setSuggestions(payload.items);
      window.localStorage.setItem(localStorageKey, JSON.stringify(payload.items));
    },
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Interview Readiness Meter</CardTitle>
        <CardDescription>Coverage-focused score for the 1400-1800 range.</CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-6">
        <div className="relative overflow-hidden rounded-3xl border p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-5xl font-semibold">{safeScore}%</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {targetSolved} solved out of {targetTotal} target problems
              </div>
            </div>
            <Badge variant={safeScore >= 70 ? "success" : "outline"}>
              {safeScore >= 70 ? "FAANG-ready momentum" : "Keep building 1400-1800 coverage"}
            </Badge>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-lime-400"
              style={{ width: `${safeScore}%` }}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              <Target className="h-4 w-4" />
              Next Milestone
            </div>
            <div className="mt-3 text-3xl font-semibold">{nextMilestone}%</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Solve {solvesForNext} more in-range problems to get there.
            </div>
          </div>
          <div className="rounded-2xl border p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Target Pool
            </div>
            <div className="mt-3 text-3xl font-semibold">{targetRemaining}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Remaining 1400-1800 problems still open for coverage.
            </div>
          </div>
        </div>

        <div className="rounded-3xl border p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Coverage Lanes
          </div>
          <div className="mt-4 grid gap-3">
            {bands.map((band) => (
              <div key={band.band} className="rounded-2xl bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{band.band}</div>
                  <div className="text-sm text-muted-foreground">
                    {band.solved}/{band.total}
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-lime-400"
                    style={{ width: `${band.coverage}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{band.coverage}% covered</span>
                  <span>{band.remaining} remaining</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Strongest Lane
            </div>
            <div className="mt-3 text-xl font-semibold">{strongestBand?.band ?? "N/A"}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              {strongestBand ? `${strongestBand.coverage}% coverage` : "No readiness band data yet."}
            </div>
          </div>
          <div className="rounded-2xl border p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Weakest Lane
            </div>
            <div className="mt-3 text-xl font-semibold">{weakestBand?.band ?? "N/A"}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              {weakestBand ? `${weakestBand.remaining} problems still open here.` : "No readiness band data yet."}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Best Next Push
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => reroll.mutate()}
              disabled={reroll.isPending}
            >
              <RefreshCcw className={`h-4 w-4 ${reroll.isPending ? "animate-spin" : ""}`} />
              Shuffle 6 picks
            </Button>
          </div>
          <div className="mt-4 grid gap-3">
            {suggestions.length ? (
              suggestions.map((problem) => (
                <Link
                  key={problem.slug}
                  href={`https://leetcode.com/problems/${problem.slug}/`}
                  target="_blank"
                  className="group flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 transition hover:bg-muted/30"
                >
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">{problem.lane}</Badge>
                      <Badge variant="outline">{problem.rating ?? "Unrated"}</Badge>
                    </div>
                    <div className="font-medium">{problem.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {problem.difficulty}
                    </div>
                  </div>
                  <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                No focused 1400-1800 recommendations available right now.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
