export type ProblemBand = {
  key: string;
  label: string;
  min: number | null;
  max: number | null;
};

export type ProblemCardData = {
  slug: string;
  title: string;
  difficulty: string;
  rating: number | null;
  topics: string[];
  bookmarkedLabel?: string | null;
  lastSolvedAt?: string | null;
  solved: boolean;
};

export type ReadinessPushCard = ProblemCardData & {
  lane: string;
};

export type HeatmapDay = {
  date: string;
  total: number;
  easy: number;
  medium: number;
  hard: number;
  problems: Array<{
    frontendId: string | null;
    title: string;
    url: string;
    difficulty: string | null;
  }>;
  source: "exact" | "calendar";
};

export type SyncOutcome = {
  ok: boolean;
  message: string;
  syncMode: "public" | "exact";
  lastSyncAt?: string;
};

export type DashboardStats = {
  user: {
    id: string;
    username: string;
    totalSolved: number;
    estimatedRating: number | null;
    estimatedRatingSampleSize: number;
    estimatedRatingLeftMidpoint: number | null;
    estimatedRatingRightMidpoint: number | null;
    contestRating: number | null;
    readinessScore: number | null;
    streakCurrent: number;
    streakLongest: number;
    hardSolvedCount: number;
    lastSyncAt: string | null;
    syncMessage: string | null;
    hasExactSolvedData: boolean;
    publicMode: boolean;
  };
  ratingDistribution: Array<{
    band: string;
    solved: number;
    total: number;
    remaining: number;
    coverage: number;
  }>;
  explorer: Record<
    string,
    {
      solved: ProblemCardData[];
      unsolved: ProblemCardData[];
      isExact: boolean;
    }
  >;
  topicBreakdown: Array<{ topic: string; solved: number }>;
  weeklyAverageRating: Array<{ week: string; averageRating: number }>;
  difficultyMix: Array<{ difficulty: string; value: number; total: number }>;
  heatmap: HeatmapDay[];
  dailySolveSummary: Array<{
    date: string;
    easy: number;
    medium: number;
    hard: number;
    total: number;
  }>;
  recommendations: ProblemCardData[];
  readinessPush: ReadinessPushCard[];
  leaderboard: Array<{
    username: string;
    totalSolved: number;
    estimatedRating: number | null;
    contestRating: number | null;
    isPrimary: boolean;
  }>;
  weeklyReport: {
    solved: number;
    averageRating: number | null;
    topicsCovered: string[];
  };
  totalProblems: number;
};
