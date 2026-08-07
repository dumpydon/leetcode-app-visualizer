"use client";

import { Bookmark, CheckCircle2, Circle, ExternalLink, RotateCcw, Star } from "lucide-react";

import { BookmarkButton } from "@/components/problems/bookmark-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProblemCardData } from "@/lib/types";

function difficultyClass(difficulty: string) {
  if (difficulty === "Easy") {
    return "border-[#00B8A3]/30 bg-[#00B8A3]/10 text-[#00B8A3]";
  }

  if (difficulty === "Hard") {
    return "border-[#FF375F]/30 bg-[#FF375F]/10 text-[#FF375F]";
  }

  return "border-[#FFC01E]/30 bg-[#FFC01E]/10 text-[#FFC01E]";
}

function HighlightedTitle({ title, search }: { title: string; search: string }) {
  const query = search.trim();

  if (!query) {
    return <>{title}</>;
  }

  const index = title.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());

  if (index === -1) {
    return <>{title}</>;
  }

  return (
    <>
      {title.slice(0, index)}
      <mark className="rounded bg-primary/20 px-0.5 text-foreground">{title.slice(index, index + query.length)}</mark>
      {title.slice(index + query.length)}
    </>
  );
}

export function ProblemRow({ item, search }: { item: ProblemCardData; search: string }) {
  const savedForReview = item.bookmarkedLabel === "REVIEW_LATER";
  const savedForRevisit = item.bookmarkedLabel === "REVISIT";
  const title = item.frontendId ? `${item.frontendId}. ${item.title}` : item.title;

  return (
    <div className="group grid gap-3 px-4 py-4 transition-all duration-200 hover:bg-muted/45 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border",
          item.solved
            ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-400"
            : "border-border bg-muted/50 text-muted-foreground"
        )}
        title={item.solved ? "Solved" : "Remaining"}
      >
        {item.solved ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
        <span className="sr-only">{item.solved ? "Solved" : "Remaining"}</span>
      </div>

      <div
        className={cn(
          "hidden h-8 w-8 items-center justify-center rounded-full border sm:flex",
          savedForReview || savedForRevisit
            ? "border-primary/25 bg-primary/10 text-primary"
            : "border-border/70 text-muted-foreground/60"
        )}
        title={
          savedForReview
            ? "Saved for review later"
            : savedForRevisit
              ? "Saved to revisit"
              : "Not bookmarked"
        }
      >
        {savedForRevisit ? <Star className="h-3.5 w-3.5 fill-current" /> : <Bookmark className="h-3.5 w-3.5" />}
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 items-start gap-2">
          <div className="min-w-0 truncate text-base font-medium tracking-tight text-foreground sm:text-[1.05rem]">
            <HighlightedTitle title={title} search={search} />
          </div>
          <a
            href={`https://leetcode.com/problems/${item.slug}/`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${item.title} on LeetCode`}
            className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-primary"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge className={cn("border", difficultyClass(item.difficulty))}>{item.difficulty}</Badge>
          {savedForReview ? <Badge variant="outline" className="gap-1.5 text-muted-foreground"><Bookmark className="h-3 w-3" />Review later</Badge> : null}
          {savedForRevisit ? <Badge variant="outline" className="gap-1.5 text-muted-foreground"><RotateCcw className="h-3 w-3" />Revisit</Badge> : null}
          {item.topics.slice(0, 2).map((topic) => (
            <span key={topic} className="text-xs text-muted-foreground">
              {topic}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <BookmarkButton
          problemSlug={item.slug}
          label="REVIEW_LATER"
          active={savedForReview}
        />
        <BookmarkButton problemSlug={item.slug} label="REVISIT" active={savedForRevisit} />
        <a
          href={`https://leetcode.com/problems/${item.slug}/`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          Open
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
