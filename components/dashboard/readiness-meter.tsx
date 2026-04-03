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
      <CardContent className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
        <div className="flex flex-col gap-6">
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

        </div>

        <div className="rounded-3xl border p-4 xl:-mt-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Best Next Push
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 border-amber-300/20 bg-amber-500/5 text-amber-100 transition duration-300 hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-gradient-to-r hover:from-amber-500/20 hover:via-orange-400/15 hover:to-yellow-300/20 hover:text-white hover:shadow-[0_16px_40px_-24px_rgba(251,191,36,0.65)]"
              onClick={() => reroll.mutate()}
              disabled={reroll.isPending}
            >
              <RefreshCcw className={`h-4 w-4 transition duration-300 ${reroll.isPending ? "animate-spin" : "hover:rotate-[-18deg]"}`} />
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
                  className="group relative flex items-start justify-between gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-slate-900/80 hover:shadow-[0_18px_45px_-24px_rgba(34,211,238,0.45)]"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                    <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-cyan-400 via-emerald-400 to-fuchsia-400" />
                    <div className="absolute -left-10 top-0 h-full w-32 -skew-x-12 bg-gradient-to-r from-cyan-400/0 via-cyan-300/12 to-emerald-300/0 blur-xl transition duration-500 group-hover:translate-x-[340px]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_34%)]" />
                  </div>
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="transition duration-300 group-hover:border-cyan-400/30 group-hover:bg-cyan-500/10 group-hover:text-cyan-100">
                        {problem.lane}
                      </Badge>
                    </div>
                    <div className="text-[1.375rem] font-medium leading-snug transition duration-300 group-hover:text-white">
                      {problem.frontendId ? `${problem.frontendId}. ` : ""}
                      {problem.title}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="transition duration-300 group-hover:text-slate-200">{problem.difficulty}</span>
                      <Badge variant="outline" className="transition duration-300 group-hover:border-emerald-400/30 group-hover:bg-emerald-500/10 group-hover:text-emerald-100">
                        {problem.rating ?? "Unrated"}
                      </Badge>
                    </div>
                  </div>
                  <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-cyan-200" />
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
