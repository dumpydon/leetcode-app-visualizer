"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Dice5 } from "lucide-react";

import { BookmarkButton } from "@/components/problems/bookmark-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RATING_BANDS, PRACTICE_RATING_BAND_OPTIONS } from "@/lib/constants";
import { ProblemCardData } from "@/lib/types";

type PracticeResponse = {
  items: ProblemCardData[];
  isExact: boolean;
};

export function PracticePanel({
  initialItems,
  exact,
}: {
  initialItems: ProblemCardData[];
  exact: boolean;
}) {
  const [difficulty, setDifficulty] = useState("All");
  const [range, setRange] = useState("All");
  const recommendations = useQuery({
    queryKey: ["recommendations", difficulty, range],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (difficulty !== "All") params.set("difficulty", difficulty);
      if (range !== "All") params.set("band", range);
      const response = await fetch(`/api/problems?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load recommendations.");
      }
      return (await response.json()) as PracticeResponse;
    },
    initialData: { items: initialItems, isExact: exact },
  });

  const randomProblem = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({ random: "1" });
      if (difficulty !== "All") params.set("difficulty", difficulty);
      if (range !== "All") {
        const band = RATING_BANDS.find((item) => item.label === range);
        if (band && !band.isUnrated && band.min !== null) {
          params.set("minRating", String(band.min));
          params.set("maxRating", String(Number.isFinite(band.max) ? band.max : 4000));
        }
      }
      const response = await fetch(`/api/problems?${params.toString()}`);
      if (!response.ok) {
        throw new Error("No random problem available.");
      }
      return (await response.json()) as { item: ProblemCardData | null };
    },
  });

  const items = recommendations.data?.items.filter((item) => !item.solved).slice(0, 10) ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Random Practice Generator</CardTitle>
          <CardDescription>Generate practice from your preferred rating range and difficulty.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger>
              <SelectValue placeholder="Rating range" />
            </SelectTrigger>
            <SelectContent>
              {PRACTICE_RATING_BAND_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger>
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {["All", "Easy", "Medium", "Hard"].map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => randomProblem.mutate()} className="gap-2">
            <Dice5 className="h-4 w-4" />
            Give me a random unsolved problem
          </Button>
        </CardContent>
      </Card>

      {randomProblem.data?.item ? (
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s random pick</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xl font-semibold">{randomProblem.data.item.title}</div>
            <div className="text-sm text-muted-foreground">
              {randomProblem.data.item.difficulty} · {randomProblem.data.item.rating ?? "Unrated"}
            </div>
            <div className="flex flex-wrap gap-2">
              {randomProblem.data.item.topics.map((topic) => (
                <Badge key={topic} variant="secondary">
                  {topic}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <BookmarkButton problemSlug={randomProblem.data.item.slug} label="REVISIT" active={false} />
              <Link
                href={`https://leetcode.com/problems/${randomProblem.data.item.slug}/`}
                target="_blank"
                className="inline-flex items-center rounded-2xl border px-4 py-2 text-sm font-medium"
              >
                Open on LeetCode
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Practice Recommendations</CardTitle>
          <CardDescription>
            10 recommended unsolved problems near your current target range.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge variant={recommendations.data?.isExact ? "success" : "outline"}>
            {recommendations.data?.isExact ? "Exact unsolved list" : "Public-mode best effort"}
          </Badge>
          <div className="grid gap-4 lg:grid-cols-2">
            {items.map((item) => (
              <Card key={item.slug} className="border shadow-none">
                <CardContent className="space-y-3 p-5">
                  <div className="text-lg font-semibold">{item.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.difficulty} · {item.rating ?? "Unrated"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.topics.slice(0, 4).map((topic) => (
                      <Badge key={topic} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <BookmarkButton problemSlug={item.slug} label="REVIEW_LATER" active={item.bookmarkedLabel === "REVIEW_LATER"} />
                    <Link
                      href={`https://leetcode.com/problems/${item.slug}/`}
                      target="_blank"
                      className="inline-flex items-center rounded-2xl border px-4 py-2 text-sm font-medium"
                    >
                      Open on LeetCode
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
