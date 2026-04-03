import { RATING_BANDS, TOPIC_SHORTLIST } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { fetchQuestionCatalogSummary } from "@/lib/services/leetcode";
import { getAllUsers, getPrimaryUser } from "@/lib/services/users";
import { DashboardStats, HeatmapDay, ProblemCardData, ReadinessPushCard } from "@/lib/types";
import {
  parseJson,
  percentage,
  titleToUrl,
  toUtcDateKey,
  unixSecondsToUtcDateKey,
  utcDateKeyToDayIndex,
} from "@/lib/utils";

function problemToCard(
  problem: {
    frontendId?: string | null;
    slug: string;
    title: string;
    difficulty: string;
    rating: number | null;
    topicNames: string;
    url: string;
  },
  solved: boolean,
  bookmarkedLabel?: string | null,
  lastSolvedAt?: string | null
) {
  return {
    frontendId: problem.frontendId ?? null,
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    rating: problem.rating,
    topics: parseJson<string[]>(problem.topicNames, []),
    bookmarkedLabel,
    lastSolvedAt,
    solved,
  } satisfies ProblemCardData;
}

function bandMatches(
  rating: number | null,
  band: (typeof RATING_BANDS)[number] | undefined
) {
  if (!band) {
    return true;
  }

  if (band.isUnrated) {
    return rating === null;
  }

  if (rating === null || band.min === null || band.max === null) {
    return false;
  }

  return rating >= band.min && rating <= band.max;
}

function createSeededRandom(seed: string) {
  let hash = 1779033703 ^ seed.length;

  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return function random() {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    const value = (hash ^= hash >>> 16) >>> 0;
    return value / 4294967296;
  };
}

function pickRandomItems<T extends { slug: string }>(
  items: T[],
  count: number,
  rng: () => number,
  excluded: Set<string>
) {
  const pool = items.filter((item) => !excluded.has(item.slug));
  const shuffled = [...pool];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  const picked = shuffled.slice(0, count);
  picked.forEach((item) => excluded.add(item.slug));
  return picked;
}

function buildReadinessPushRecommendations({
  problems,
  solvedSet,
  baseRating,
  bookmarkMap,
  rng,
}: {
  problems: Array<{
    frontendId?: string | null;
    slug: string;
    title: string;
    difficulty: string;
    rating: number | null;
    topicNames: string;
    url: string;
    isPaidOnly: boolean;
  }>;
  solvedSet: Set<string>;
  baseRating: number;
  bookmarkMap?: Map<string, string | null>;
  rng: () => number;
}) {
  const lanes = [
    {
      label: `${baseRating}-${baseRating + 50}`,
      min: baseRating,
      max: baseRating + 50,
      count: 2,
    },
    {
      label: `${baseRating + 100}-${baseRating + 200}`,
      min: baseRating + 100,
      max: baseRating + 200,
      count: 2,
    },
    {
      label: `${baseRating}-${baseRating + 500}`,
      min: baseRating,
      max: baseRating + 500,
      count: 2,
    },
  ] as const;

  const excluded = new Set<string>();

  return lanes.flatMap((lane) => {
    const lanePool = problems.filter(
      (problem) =>
        !problem.isPaidOnly &&
        !solvedSet.has(problem.slug) &&
        typeof problem.rating === "number" &&
        problem.rating >= lane.min &&
        problem.rating <= lane.max
    );

    return pickRandomItems(lanePool, lane.count, rng, excluded).map((problem) => ({
      ...problemToCard(problem, false, bookmarkMap?.get(problem.slug) ?? null),
      lane: lane.label,
    })) satisfies ReadinessPushCard[];
  });
}

export async function getDashboardStats(userId?: string): Promise<DashboardStats | null> {
  const user =
    userId != null
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await getPrimaryUser();

  if (!user) {
    return null;
  }

  const [allUsers, allProblems, solvedProblems, submissions, bookmarks, catalogSummary] =
    await Promise.all([
    getAllUsers(),
    prisma.problem.findMany({
      orderBy: [{ rating: "asc" }, { frontendId: "asc" }],
    }),
    prisma.userProblem.findMany({
      where: { userId: user.id },
      include: { problem: true },
    }),
    prisma.submission.findMany({
      where: { userId: user.id, isAccepted: true },
      include: { problem: true },
      orderBy: { submittedAt: "asc" },
    }),
    prisma.bookmark.findMany({
      where: { userId: user.id },
    }),
    fetchQuestionCatalogSummary(),
  ]);

  const solvedMap = new Map(
    solvedProblems.map((item) => [item.problemSlug, item] as const)
  );
  const problems = allProblems.filter((problem) => !problem.isPaidOnly);
  const problemMap = new Map(allProblems.map((problem) => [problem.slug, problem] as const));
  const exactSolvedMap = new Map(
    solvedProblems
      .filter((item) => item.confidence === "EXACT")
      .map((item) => [item.problemSlug, item] as const)
  );
  const bookmarkMap = new Map(
    bookmarks.map((item) => [item.problemSlug, item.label] as const)
  );

  const totalProblems = catalogSummary.total;
  const ratingDistribution = RATING_BANDS.map((band) => {
    const bandProblems = problems.filter((problem) => bandMatches(problem.rating, band));
    const solvedCount = bandProblems.filter((problem) =>
      (user.hasExactSolvedData ? exactSolvedMap : solvedMap).has(problem.slug)
    ).length;

    return {
      band: band.label,
      solved: solvedCount,
      total: bandProblems.length,
      remaining: Math.max(bandProblems.length - solvedCount, 0),
      coverage: percentage(solvedCount, bandProblems.length),
    };
  });

  const topicBreakdown = user.hasExactSolvedData
    ? Array.from(
        solvedProblems.reduce((accumulator, item) => {
          for (const topic of parseJson<string[]>(item.problem.topicNames, [])) {
            accumulator.set(topic, (accumulator.get(topic) ?? 0) + 1);
          }

          return accumulator;
        }, new Map<string, number>())
      )
        .map(([topic, solved]) => ({ topic, solved }))
        .sort((left, right) => right.solved - left.solved)
        .slice(0, 10)
    : parseJson<Array<{ topic: string; solved: number }>>(user.topicCounts, [])
        .sort((left, right) => right.solved - left.solved)
        .slice(0, 10);

  const difficultyMix = ["Easy", "Medium", "Hard"].map((difficulty) => ({
    difficulty,
    value:
      difficulty === "Easy"
        ? user.totalEasy
        : difficulty === "Medium"
          ? user.totalMedium
          : user.totalHard,
    total:
      difficulty === "Easy"
        ? catalogSummary.easy
        : difficulty === "Medium"
          ? catalogSummary.medium
          : catalogSummary.hard,
  }));

  const ratedSolvedValues = solvedProblems
    .filter((item) => item.confidence === "EXACT")
    .map((item) => item.problem.rating)
    .filter((value): value is number => typeof value === "number")
    .sort((left, right) => left - right);
  const exactSolvedCount = solvedProblems.filter((item) => item.confidence === "EXACT").length;
  const ratedSolvedCount = ratedSolvedValues.length;
  const unratedSolvedCount = Math.max(exactSolvedCount - ratedSolvedCount, 0);
  const estimatedRatingLeftMidpoint =
    ratedSolvedCount > 0 ? ratedSolvedValues[Math.floor((ratedSolvedCount - 1) / 2)] : null;
  const estimatedRatingRightMidpoint =
    ratedSolvedCount > 0 ? ratedSolvedValues[Math.floor(ratedSolvedCount / 2)] : null;

  const recentAccepted = parseJson<
    Array<{ title: string; slug: string; timestamp: string }>
  >(user.recentAccepted, []);
  const submissionCalendar = parseJson<Record<string, number>>(user.submissionCalendar, {});

  const exactHeatmap = submissions.reduce((accumulator, submission) => {
    const key = toUtcDateKey(submission.submittedAt);
    const item = accumulator.get(key) ?? {
      date: key,
      total: 0,
      easy: 0,
      medium: 0,
      hard: 0,
      problems: [],
      source: "exact" as const,
    };

    item.total += 1;
    item.problems.push({
      frontendId: submission.problem.frontendId,
      title: submission.problem.title,
      url: submission.problem.url,
      difficulty: submission.problem.difficulty,
    });

    if (submission.problem.difficulty === "Easy") {
      item.easy += 1;
    }
    if (submission.problem.difficulty === "Medium") {
      item.medium += 1;
    }
    if (submission.problem.difficulty === "Hard") {
      item.hard += 1;
    }

    accumulator.set(key, item);
    return accumulator;
  }, new Map<string, HeatmapDay>());

  for (const [timestamp, total] of Object.entries(submissionCalendar)) {
    const date = unixSecondsToUtcDateKey(timestamp);

    if (!exactHeatmap.has(date)) {
      exactHeatmap.set(date, {
        date,
        total,
        easy: 0,
        medium: 0,
        hard: 0,
        problems: recentAccepted
          .filter((item) => unixSecondsToUtcDateKey(item.timestamp) === date)
          .map((item) => ({
            frontendId: problemMap.get(item.slug)?.frontendId ?? null,
            title: item.title,
            url: problemMap.get(item.slug)?.url ?? titleToUrl(item.slug),
            difficulty: problemMap.get(item.slug)?.difficulty ?? null,
          })),
        source: "calendar",
      });
    }
  }

  const heatmap = Array.from(exactHeatmap.values()).sort((left, right) =>
    left.date.localeCompare(right.date)
  );

  const dailySolveSummary = heatmap.slice(-10).map((item) => ({
    date: item.date,
    easy: item.easy,
    medium: item.medium,
    hard: item.hard,
    total: item.total,
  }));

  const targetRating = user.estimatedRating ?? Math.round(user.contestRating ?? 1550);
  const solvedSet = user.hasExactSolvedData ? exactSolvedMap : solvedMap;
  const recommendations = problems
    .filter((problem) => !solvedSet.has(problem.slug) && problem.rating !== null)
    .sort((left, right) => {
      const leftDelta = Math.abs((left.rating ?? targetRating) - targetRating);
      const rightDelta = Math.abs((right.rating ?? targetRating) - targetRating);
      return leftDelta - rightDelta;
    })
    .slice(0, 10)
    .map((problem) =>
      problemToCard(problem, false, bookmarkMap.get(problem.slug) ?? null)
    );

  const todayUtcKey = toUtcDateKey(new Date());
  const todayUtcIndex = utcDateKeyToDayIndex(todayUtcKey);
  const sevenDayWindowStart = todayUtcIndex - 6;
  const recentSubmissions = submissions.filter(
    (submission) => utcDateKeyToDayIndex(toUtcDateKey(submission.submittedAt)) >= sevenDayWindowStart
  );
  const recentRatedSubmissions = recentSubmissions.filter(
    (submission) => typeof submission.problem.rating === "number"
  );
  const weeklyReportTopics = Array.from(
    new Set(
      recentSubmissions.flatMap((submission) =>
        parseJson<string[]>(submission.problem.topicNames, [])
      )
    )
  ).slice(0, 6);

  const hardSolvedCount = solvedProblems.filter(
    (item) => (item.problem.rating ?? 0) >= 1800
  ).length;

  const readinessBands = ratingDistribution.filter((item) => {
    const band = RATING_BANDS.find((candidate) => candidate.label === item.band);
    return (
      band &&
      !band.isUnrated &&
      band.min !== null &&
      band.max !== null &&
      band.min >= 1400 &&
      band.max < 1800
    );
  });
  const readinessScore =
    user.readinessScore ??
    Math.round(
      readinessBands.length
        ? readinessBands.reduce((total, item) => total + item.coverage, 0) /
            readinessBands.length
        : 0
    );
  const readinessPush = buildReadinessPushRecommendations({
    problems,
    solvedSet: new Set(Array.from(solvedSet.keys())),
    baseRating: targetRating,
    bookmarkMap,
    rng: createSeededRandom(
      `${user.id}:${targetRating}:${user.lastSyncAt?.toISOString() ?? "no-sync"}`
    ),
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      totalSolved: user.totalSolved,
      estimatedRating: user.estimatedRating,
      estimatedRatingSampleSize: ratedSolvedCount,
      exactSolvedCount,
      exactRatedSolvedCount: ratedSolvedCount,
      exactUnratedSolvedCount: unratedSolvedCount,
      estimatedRatingLeftMidpoint,
      estimatedRatingRightMidpoint,
      contestRating: user.contestRating,
      readinessScore,
      streakCurrent: user.streakCurrent,
      streakLongest: user.streakLongest,
      hardSolvedCount,
      lastSyncAt: user.lastSyncAt?.toISOString() ?? null,
      syncMessage: user.syncMessage ?? null,
      hasExactSolvedData: user.hasExactSolvedData,
      publicMode: user.publicMode,
    },
    ratingDistribution,
    explorer: {},
    topicBreakdown:
      topicBreakdown.length > 0
        ? topicBreakdown
        : TOPIC_SHORTLIST.map((topic) => ({ topic, solved: 0 })),
    difficultyMix,
    heatmap,
    dailySolveSummary,
    recommendations,
    readinessPush,
    leaderboard: allUsers.map((entry) => ({
      username: entry.username,
      totalSolved: entry.totalSolved,
      estimatedRating: entry.estimatedRating,
      contestRating: entry.contestRating,
      isPrimary: entry.isPrimary,
    })),
    weeklyReport: {
      solved: recentSubmissions.length,
      averageRating: recentRatedSubmissions.length
        ? Math.round(
            recentRatedSubmissions.reduce((total, item) => total + (item.problem.rating ?? 0), 0) /
              recentRatedSubmissions.length
          )
        : null,
      topicsCovered: weeklyReportTopics,
    },
    totalProblems,
  };
}

export async function getReadinessPushRecommendations(randomize = true) {
  const user = await getPrimaryUser();

  if (!user) {
    return [];
  }

  const [problems, solvedProblems, bookmarks] = await Promise.all([
    prisma.problem.findMany({
      where: { isPaidOnly: false },
      orderBy: [{ rating: "asc" }, { frontendId: "asc" }],
    }),
    prisma.userProblem.findMany({
      where: { userId: user.id },
      select: { problemSlug: true },
    }),
    prisma.bookmark.findMany({
      where: { userId: user.id },
    }),
  ]);

  const solvedSet = new Set(solvedProblems.map((item) => item.problemSlug));
  const bookmarkMap = new Map(
    bookmarks.map((item) => [item.problemSlug, item.label] as const)
  );
  const baseRating = user.estimatedRating ?? Math.round(user.contestRating ?? 1550);

  return buildReadinessPushRecommendations({
    problems,
    solvedSet,
    baseRating,
    bookmarkMap,
    rng: randomize
      ? () => Math.random()
      : createSeededRandom(`${user.id}:${baseRating}:${user.lastSyncAt?.toISOString() ?? "no-sync"}`),
  });
}

export async function getProblemExplorer(options?: {
  userId?: string;
  band?: string | null;
  search?: string | null;
  difficulty?: string | null;
  solved?: "solved" | "remaining" | null;
}) {
  const user =
    options?.userId != null
      ? await prisma.user.findUnique({ where: { id: options.userId } })
      : await getPrimaryUser();

  if (!user) {
    return null;
  }

  const [problems, solvedProblems, bookmarks] = await Promise.all([
    prisma.problem.findMany({
      where: { isPaidOnly: false },
      orderBy: [{ rating: "asc" }, { frontendId: "asc" }],
    }),
    prisma.userProblem.findMany({
      where: { userId: user.id },
      include: { problem: true },
    }),
    prisma.bookmark.findMany({
      where: { userId: user.id },
    }),
  ]);

  const solvedMap = new Map(
    solvedProblems.map((item) => [item.problemSlug, item] as const)
  );
  const bookmarkMap = new Map(
    bookmarks.map((item) => [item.problemSlug, item.label] as const)
  );
  const band = RATING_BANDS.find((item) => item.label === options?.band);
  const search = options?.search?.toLowerCase().trim();

  const filtered = problems.filter((problem) => {
    if (!bandMatches(problem.rating, band)) {
      return false;
    }

    if (options?.difficulty && options.difficulty !== "All") {
      if (problem.difficulty !== options.difficulty) {
        return false;
      }
    }

    if (search && !problem.title.toLowerCase().includes(search)) {
      return false;
    }

    const isSolved = solvedMap.has(problem.slug);

    if (options?.solved === "solved" && !isSolved) {
      return false;
    }

    if (options?.solved === "remaining" && isSolved) {
      return false;
    }

    return true;
  });

  return {
    isExact: user.hasExactSolvedData,
    items: filtered.map((problem) =>
      problemToCard(
        problem,
        solvedMap.has(problem.slug),
        bookmarkMap.get(problem.slug) ?? null,
        solvedMap.get(problem.slug)?.lastSolvedAt?.toISOString() ?? null
      )
    ),
  };
}

export async function getRandomPracticeProblem(filters?: {
  difficulty?: string | null;
  minRating?: number | null;
  maxRating?: number | null;
}) {
  const user = await getPrimaryUser();

  if (!user) {
    return null;
  }

  const solved = await prisma.userProblem.findMany({
    where: { userId: user.id },
    select: { problemSlug: true },
  });

  const solvedSet = new Set(solved.map((item) => item.problemSlug));

  const candidates = await prisma.problem.findMany({
    where: {
      isPaidOnly: false,
      difficulty: filters?.difficulty && filters.difficulty !== "All" ? filters.difficulty : undefined,
      rating: {
        gte: filters?.minRating ?? undefined,
        lte: filters?.maxRating ?? undefined,
      },
    },
  });

  const pool = candidates.filter((item) => !solvedSet.has(item.slug));

  if (!pool.length) {
    return null;
  }

  const randomProblem = pool[Math.floor(Math.random() * pool.length)];
  return problemToCard(randomProblem, false);
}
