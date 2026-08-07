import { RATING_BANDS } from "@/lib/constants";
import { ProblemCardData } from "@/lib/types";

export type ExplorerGroup = {
  band: string;
  items: ProblemCardData[];
  total: number;
  solved: number;
  remaining: number;
  coverage: number;
  easy: number;
  medium: number;
  hard: number;
  bookmarked: number;
  reviewLater: number;
  revisit: number;
};

function ratingBandFor(rating: number | null) {
  if (rating === null) {
    return "Unavailable";
  }

  const band = RATING_BANDS.find(
    (candidate) =>
      !candidate.isUnrated &&
      candidate.min !== null &&
      candidate.max !== null &&
      rating >= candidate.min &&
      rating <= candidate.max
  );

  return band?.label ?? "Unavailable";
}

export function buildExplorerGroups(items: ProblemCardData[]) {
  const groupedItems = new Map<string, ProblemCardData[]>();

  for (const item of items) {
    const band = ratingBandFor(item.rating);
    const group = groupedItems.get(band) ?? [];
    group.push(item);
    groupedItems.set(band, group);
  }

  return RATING_BANDS.flatMap((band) => {
    const groupItems = groupedItems.get(band.label) ?? [];

    if (!groupItems.length) {
      return [];
    }

    const solved = groupItems.filter((item) => item.solved).length;
    const total = groupItems.length;

    return [
      {
        band: band.label,
        items: groupItems,
        total,
        solved,
        remaining: total - solved,
        coverage: total ? (solved / total) * 100 : 0,
        easy: groupItems.filter((item) => item.difficulty === "Easy").length,
        medium: groupItems.filter((item) => item.difficulty === "Medium").length,
        hard: groupItems.filter((item) => item.difficulty === "Hard").length,
        bookmarked: groupItems.filter((item) => Boolean(item.bookmarkedLabel)).length,
        reviewLater: groupItems.filter((item) => item.bookmarkedLabel === "REVIEW_LATER").length,
        revisit: groupItems.filter((item) => item.bookmarkedLabel === "REVISIT").length,
      } satisfies ExplorerGroup,
    ];
  });
}
