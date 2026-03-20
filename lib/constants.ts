const NUMERIC_RATING_BANDS = Array.from({ length: 15 }).map((_, index) => {
  const min = 1000 + index * 100;
  const max = min + 99;
  const labelMax = min + 100;

  return {
    key: `${min}-${labelMax}`,
    min,
    max,
    label: `${min}-${labelMax}`,
    isUnrated: false,
  };
});

export const RATING_BANDS = [
  {
    key: "unavailable",
    label: "Unavailable",
    min: null,
    max: null,
    isUnrated: true,
  },
  ...NUMERIC_RATING_BANDS,
  {
    key: "2500+",
    min: 2500,
    max: Number.POSITIVE_INFINITY,
    label: "2500+",
    isUnrated: false,
  },
] as const;

export const EXPLORER_RATING_BAND_OPTIONS = ["All", ...RATING_BANDS.map((band) => band.label)] as const;
export const PRACTICE_RATING_BAND_OPTIONS = [
  "All",
  ...RATING_BANDS.filter((band) => !band.isUnrated).map((band) => band.label),
] as const;

export const DIFFICULTY_ORDER = ["Easy", "Medium", "Hard"] as const;
export const TOPIC_SHORTLIST = ["Array", "Dynamic Programming", "Tree", "Graph", "Greedy"];
