"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

import { BookmarkButton } from "@/components/problems/bookmark-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPLORER_RATING_BAND_OPTIONS } from "@/lib/constants";
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

  const groupedSummary = useMemo(() => {
    const solvedCount = query.data?.items.filter((item) => item.solved).length ?? 0;
    const remainingCount = (query.data?.items.length ?? 0) - solvedCount;
    return { solvedCount, remainingCount };
  }, [query.data?.items]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Clickable Rating Explorer</CardTitle>
          <CardDescription>
            Browse solved and remaining problems by rating band, difficulty, and title.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Rating band</div>
            <Select value={band} onValueChange={setBand}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPLORER_RATING_BAND_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Difficulty</div>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["All", "Easy", "Medium", "Hard"].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Solved status</div>
            <Select value={solved} onValueChange={setSolved}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["All", "Solved", "Remaining"].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Search</div>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title" />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Badge variant="outline">Solved: {groupedSummary.solvedCount}</Badge>
        <Badge variant="outline">Remaining: {groupedSummary.remainingCount}</Badge>
        <Badge variant={query.data?.isExact ? "success" : "outline"}>
          {query.data?.isExact ? "Exact solved set" : "Public-mode approximation"}
        </Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {query.data?.items.map((item) => (
          <Card key={item.slug}>
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">{item.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {item.difficulty} · {item.rating ? item.rating : "Unrated"}
                  </div>
                </div>
                <Badge variant={item.solved ? "success" : "outline"}>
                  {item.solved ? "Solved" : "Remaining"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.topics.slice(0, 4).map((topic) => (
                  <Badge key={topic} variant="secondary">
                    {topic}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <BookmarkButton
                  problemSlug={item.slug}
                  label="REVIEW_LATER"
                  active={item.bookmarkedLabel === "REVIEW_LATER"}
                />
                <BookmarkButton
                  problemSlug={item.slug}
                  label="REVISIT"
                  active={item.bookmarkedLabel === "REVISIT"}
                />
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
    </div>
  );
}
