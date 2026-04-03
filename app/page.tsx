import Link from "next/link";
import {
  Flame,
  Gem,
  ListChecks,
  UserRound,
} from "lucide-react";

import { DifficultyMixChart } from "@/components/dashboard/difficulty-mix-chart";
import { DailySolvesTracker } from "@/components/dashboard/daily-solves-tracker";
import { SolveHeatmap } from "@/components/dashboard/heatmap";
import { ReadinessMeter } from "@/components/dashboard/readiness-meter";
import { RatingDistributionChart } from "@/components/dashboard/rating-distribution-chart";
import { SkillRatingCard } from "@/components/dashboard/skill-rating-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { SyncButton } from "@/components/dashboard/sync-button";
import { EntrantHubRatingProgress } from "@/components/dashboard/entranthub-rating-progress";
import { OnboardingForm } from "@/components/forms/onboarding-form";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/services/analytics-service";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stats = await getDashboardStats();

  if (!stats) {
    return (
      <div className="app-grid flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
              LeetCode Visualizer
            </div>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight">
              Production-ready practice analytics.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Connect your username, pull in Zerotrac ratings, and turn raw LeetCode history into a clean developer dashboard.
            </p>
          </div>
          <OnboardingForm />
        </div>
      </div>
    );
  }

  const skillRatingHint = stats.user.hasExactSolvedData
    ? stats.user.estimatedRatingSampleSize > 0
      ? `Recomputed on sync from ${stats.user.estimatedRatingSampleSize} Zerotrac-rated exact solves. Uses the 75th percentile of your solved-problem ratings.`
      : "Recomputed on sync, but none of your exact solved problems currently have Zerotrac ratings."
    : "75th percentile of Zerotrac ratings from your solved problems.";
  const readinessBands = stats.ratingDistribution.filter((row) => {
    if (row.band === "Unavailable" || row.band.endsWith("+")) {
      return false;
    }

    const [min, max] = row.band.split("-").map(Number);
    return Number.isFinite(min) && Number.isFinite(max) && min >= 1400 && max <= 1800;
  });
  const solvedCompletion = stats.totalProblems
    ? ((stats.user.totalSolved / stats.totalProblems) * 100).toFixed(2)
    : "0.00";
  const solvedBreakdownHint = stats.user.hasExactSolvedData ? (
    <div className="space-y-1">
      <div>
        {stats.user.totalSolved} of {stats.totalProblems} problems solved
      </div>
      <div>
        {stats.user.exactRatedSolvedCount} Zerotrac-rated exact solves
      </div>
      <div>
        {stats.user.exactUnratedSolvedCount} unrated exact solves
      </div>
    </div>
  ) : (
    <div className="space-y-1">
      <div>
        {stats.user.totalSolved} of {stats.totalProblems} problems solved
      </div>
      <div>Exact rated/unrated breakdown is unavailable in public mode</div>
    </div>
  );
  const dailySolvesWithProblems = stats.dailySolveSummary.slice().reverse().map((item) => ({
    ...item,
    problems: stats.heatmap.find((day) => day.date === item.date)?.problems ?? [],
  }));
  return (
    <AppShell activePath="/">
      <section className="glass-card overflow-hidden p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Dashboard
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              {stats.user.username}
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Personal analytics for solved problems, rating coverage, weekly momentum, and focused practice recommendations.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant={stats.user.hasExactSolvedData ? "success" : "outline"}>
                {stats.user.hasExactSolvedData ? "Exact solved-set mode" : "Public profile mode"}
              </Badge>
              {stats.user.lastSyncAt ? (
                <Badge variant="secondary">Last sync {formatDate(stats.user.lastSyncAt, "MMM d, h:mm a")}</Badge>
              ) : null}
            </div>
            {stats.user.syncMessage ? (
              <p className="mt-4 max-w-3xl text-sm text-muted-foreground">{stats.user.syncMessage}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <SyncButton />
            <Link
              href="/settings"
              className="inline-flex items-center rounded-2xl border px-4 py-2 text-sm font-medium"
            >
              Settings
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total solved"
          value={
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold tracking-tight">
                {stats.user.totalSolved}
              </span>
              <span className="text-sm text-muted-foreground">
                {solvedCompletion}% solved
              </span>
            </div>
          }
          hint={solvedBreakdownHint}
          icon={ListChecks}
        />
        <SkillRatingCard
          value={stats.user.estimatedRating ? stats.user.estimatedRating.toString() : "N/A"}
          hint={skillRatingHint}
        />
        <StatCard label="Current streak" value={`${stats.user.streakCurrent}d`} hint={`Longest streak ${stats.user.streakLongest}d`} icon={Flame} />
        <StatCard label="Solved 1800+ rating" value={stats.user.hardSolvedCount.toString()} hint="Solved problems with Zerotrac rating 1800 or higher." icon={Gem} />
      </section>

      <section>
        <RatingDistributionChart data={stats.ratingDistribution} exact={stats.user.hasExactSolvedData} />
      </section>

      <section>
        <ReadinessMeter
          score={stats.user.readinessScore}
          bands={readinessBands}
          initialSuggestions={stats.readinessPush}
          storageKey={`${stats.user.username}:${stats.user.estimatedRating ?? "na"}:${stats.user.lastSyncAt ?? "no-sync"}`}
        />
      </section>

      <SolveHeatmap data={stats.heatmap} />

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Practice Report</CardTitle>
              <CardDescription>Rolling seven-day summary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border p-4">
                  <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Solved</div>
                  <div className="mt-2 text-2xl font-semibold">{stats.weeklyReport.solved}</div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Avg rating</div>
                  <div className="mt-2 text-2xl font-semibold">{stats.weeklyReport.averageRating ?? "N/A"}</div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Readiness</div>
                  <div className="mt-2 text-2xl font-semibold">{stats.user.readinessScore ?? 0}%</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.weeklyReport.topicsCovered.map((topic) => (
                  <Badge key={topic} variant="secondary">
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <DifficultyMixChart
            data={stats.difficultyMix}
            totalSolved={stats.user.totalSolved}
            totalProblems={stats.totalProblems}
          />
        </div>

        <DailySolvesTracker items={dailySolvesWithProblems} />

        <div className="xl:col-span-2">
          <EntrantHubRatingProgress username={stats.user.username} />
        </div>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard Mode</CardTitle>
            <CardDescription>Compare your saved usernames at a glance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.leaderboard.map((entry, index) => (
              <div key={entry.username} className="flex items-center justify-between rounded-2xl border px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{entry.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {entry.totalSolved} solved · skill {entry.estimatedRating ?? "N/A"}
                    </div>
                  </div>
                </div>
                {entry.isPrimary ? <Badge variant="success">You</Badge> : <UserRound className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
