"use client";

import { Gauge, Info } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const SKILL_RATING_EXPLANATION = `────────────────────────────────────────
About Skill Rating
────────────────────────────────────────

Skill Rating estimates the difficulty level of problems you can
solve consistently, based on the 75th percentile of the difficulty
ratings of the problems you have solved.

Formula
SkillRating = P75(SolvedProblemRatings)

P75 is the difficulty value below which 75% of your solved problems fall.

Interpretation
A Skill Rating of 1680 means problems around difficulty 1680 are
solvable for you roughly 75% of the time.

Why this metric is used
Using an upper percentile focuses on the range where problem solving
becomes consistently successful while remaining stable even when many
easier problems are solved.
────────────────────────────────────────`;

export function SkillRatingCard({
  value,
  hint,
}: {
  value: string;
  hint?: string;
}) {
  return (
    <Dialog>
      <Card className="animate-fade-up">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm text-muted-foreground">Skill Rating</CardTitle>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Open skill rating explanation"
              className="rounded-2xl bg-muted p-2 transition hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <Info className="h-4 w-4" />
            </button>
          </DialogTrigger>
        </CardHeader>
        <CardContent>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Open skill rating explanation"
              className="text-left"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl font-semibold tracking-tight">{value}</div>
                <Gauge className="h-5 w-5 text-muted-foreground" />
              </div>
            </button>
          </DialogTrigger>
          {hint ? <p className="mt-2 text-sm text-muted-foreground">{hint}</p> : null}
        </CardContent>
      </Card>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About Skill Rating</DialogTitle>
          <DialogDescription className="sr-only">
            Explanation of how the skill rating metric is calculated.
          </DialogDescription>
        </DialogHeader>
        <pre className="whitespace-pre-wrap text-sm leading-6 text-foreground">
          {SKILL_RATING_EXPLANATION}
        </pre>
      </DialogContent>
    </Dialog>
  );
}
