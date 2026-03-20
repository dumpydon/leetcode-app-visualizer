import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  fetchContestHistory,
  fetchPublicProfile,
  fetchQuestionCatalog,
  fetchQuestionCatalogSummary,
  fetchRecentAccepted,
  fetchSolvedQuestions,
} from "@/lib/services/leetcode";
import { fetchZerotracRatings } from "@/lib/services/zerotrac";
import { getPrimaryUser } from "@/lib/services/users";
import { chunk, median, normalizeTitle, titleToUrl, unixToIso } from "@/lib/utils";

function computeLongestStreak(calendar: Record<string, number>) {
  const dates = Object.entries(calendar)
    .filter(([, count]) => count > 0)
    .map(([timestamp]) => new Date(Number(timestamp) * 1000))
    .sort((left, right) => left.getTime() - right.getTime());

  if (!dates.length) {
    return 0;
  }

  let longest = 1;
  let current = 1;

  for (let index = 1; index < dates.length; index += 1) {
    const previous = dates[index - 1];
    const currentDate = dates[index];
    const delta = Math.round(
      (currentDate.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (delta === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function dedupeSolvedQuestions(questions: Awaited<ReturnType<typeof fetchSolvedQuestions>>) {
  const bySlug = new Map<string, (typeof questions)[number]>();

  for (const question of questions) {
    const existing = bySlug.get(question.slug);

    if (!existing) {
      bySlug.set(question.slug, question);
      continue;
    }

    const existingTime = existing.lastSolvedAt ? new Date(existing.lastSolvedAt).getTime() : 0;
    const nextTime = question.lastSolvedAt ? new Date(question.lastSolvedAt).getTime() : 0;

    if (nextTime >= existingTime) {
      bySlug.set(question.slug, question);
    }
  }

  return Array.from(bySlug.values());
}

function dedupeSubmissionRows<T extends { problemSlug: string; submittedAt: Date }>(rows: T[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.problemSlug}:${row.submittedAt.toISOString()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function ensureProblemCatalog() {
  const existing = await prisma.problem.count();
  const summary = await fetchQuestionCatalogSummary();

  if (existing >= summary.total) {
    console.log("[sync] problem catalog already up to date, skipping catalog refresh", {
      existing,
      total: summary.total,
    });
    return;
  }

  console.log("[sync] refreshing LeetCode catalog and Zerotrac ratings", {
    existing,
    total: summary.total,
  });

  const [catalog, zerotracRatings] = await Promise.all([
    fetchQuestionCatalog(),
    fetchZerotracRatings(),
  ]);

  for (const batch of chunk(catalog, 100)) {
    await prisma.$transaction(
      batch.map((problem) =>
        prisma.problem.upsert({
          where: { slug: problem.slug },
          create: {
            slug: problem.slug,
            frontendId: problem.frontendId,
            title: problem.title,
            normalized: normalizeTitle(problem.title),
            difficulty: problem.difficulty,
            rating: zerotracRatings.get(problem.slug) ?? null,
            topicNames: JSON.stringify(problem.topics),
            url: titleToUrl(problem.slug),
            isPaidOnly: problem.isPaidOnly,
          },
          update: {
            frontendId: problem.frontendId,
            title: problem.title,
            normalized: normalizeTitle(problem.title),
            difficulty: problem.difficulty,
            rating: zerotracRatings.get(problem.slug) ?? null,
            topicNames: JSON.stringify(problem.topics),
            url: titleToUrl(problem.slug),
            isPaidOnly: problem.isPaidOnly,
          },
        })
      )
    );
  }
}

async function updateDerivedUserMetrics(userId: string) {
  const solvedProblems = await prisma.userProblem.findMany({
    where: { userId, confidence: "EXACT" },
    include: { problem: true },
  });

  if (!solvedProblems.length) {
    return;
  }

  const ratings = solvedProblems
    .map((item) => item.problem.rating)
    .filter((value): value is number => typeof value === "number");

  const solvedSet = new Set(solvedProblems.map((item) => item.problemSlug));
  const readinessPool = await prisma.problem.findMany({
    where: {
      rating: {
        gte: 1400,
        lt: 1800,
      },
      isPaidOnly: false,
    },
    select: { slug: true },
  });

  const readinessSolved = readinessPool.filter((item) => solvedSet.has(item.slug)).length;
  const readinessScore = readinessPool.length
    ? Math.round((readinessSolved / readinessPool.length) * 100)
    : 0;
  await prisma.user.update({
    where: { id: userId },
    data: {
      estimatedRating: median(ratings),
      readinessScore,
      syncMessage: `Exact solved-set sync unlocked across ${solvedProblems.length} problems.`,
      lastSyncStatus: "success",
      publicMode: false,
      hasExactSolvedData: true,
    },
  });
}

export async function syncPrimaryUser() {
  const user = await getPrimaryUser();

  if (!user) {
    throw new Error("Create a user profile before syncing.");
  }

  return syncUser(user.id);
}

export async function syncUser(userId: string) {
  console.log("[sync] starting sync for user", userId);
  await ensureProblemCatalog();

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  console.log("[sync] loaded user", user.username);

  const auth = {
    session: user.leetcodeSession || env.leetcodeSession || null,
    csrfToken: user.leetcodeCsrfToken || env.leetcodeCsrfToken || null,
  };

  const [profile, recentAccepted, contestHistory] = await Promise.all([
    fetchPublicProfile(user.username),
    fetchRecentAccepted(user.username),
    fetchContestHistory(user.username),
  ]);

  console.log("[sync] fetched public profile data", {
    username: user.username,
    totalSolved: profile.totalSolved,
    recentAccepted: recentAccepted.length,
    contestEntries: contestHistory.length,
  });

  let solvedQuestions = [] as Awaited<ReturnType<typeof fetchSolvedQuestions>>;
  let exactSync = false;
  let exactSyncError: string | null = null;

  try {
    solvedQuestions = await fetchSolvedQuestions(auth);
    exactSync = solvedQuestions.length > 0;
    console.log("[sync] authenticated solved question sync", {
      enabled: exactSync,
      count: solvedQuestions.length,
    });
  } catch (error) {
    exactSync = false;
    exactSyncError = error instanceof Error ? error.message : "Unknown exact sync error.";
    console.log("[sync] exact solved question sync unavailable, continuing in public mode", {
      reason: exactSyncError,
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      displayName: profile.username,
      totalSolved: profile.totalSolved,
      totalEasy: profile.totalEasy,
      totalMedium: profile.totalMedium,
      totalHard: profile.totalHard,
      contestRating: profile.contestRating,
      contestGlobalRanking: profile.contestGlobalRanking,
      streakCurrent: profile.streakCurrent,
      streakLongest: computeLongestStreak(profile.submissionCalendar),
      topicCounts: JSON.stringify(profile.topicCounts),
      recentAccepted: JSON.stringify(recentAccepted),
      submissionCalendar: JSON.stringify(profile.submissionCalendar),
      lastSyncAt: new Date(),
      lastSyncStatus: "success",
      syncMessage: exactSync
        ? "Exact sync completed using authenticated LeetCode access."
        : exactSyncError
          ? `Public sync completed. Exact mode is disabled: ${exactSyncError}`
          : "Public sync completed. Add your optional LeetCode session in Settings for exact solved/unsolved analytics.",
      publicMode: !exactSync && !user.hasExactSolvedData,
      hasExactSolvedData: exactSync || user.hasExactSolvedData,
      lastFullSyncAt: exactSync ? new Date() : user.lastFullSyncAt,
    },
  });

  await prisma.contestHistory.deleteMany({
    where: { userId },
  });

  if (contestHistory.length) {
    await prisma.contestHistory.createMany({
      data: contestHistory.map((item) => ({
        userId,
        contestTitle: item.contestTitle,
        contestStartTime: new Date(item.contestStartTime),
        rating: item.rating,
        ranking: item.ranking,
        problemsSolved: item.problemsSolved,
        totalProblems: item.totalProblems,
        finishTimeSeconds: item.finishTimeSeconds,
      })),
    });
  }

  const recentProblems = await prisma.problem.findMany({
    where: { slug: { in: recentAccepted.map((item) => item.slug) } },
    select: { slug: true },
  });

  const recentSlugs = new Set(recentProblems.map((item) => item.slug));

  if (recentAccepted.length && !exactSync) {
    await prisma.submission.deleteMany({
      where: {
        userId,
        source: "PUBLIC_RECENT",
      },
    });

    const recentSubmissionRows = dedupeSubmissionRows(
      recentAccepted
        .filter((item) => recentSlugs.has(item.slug))
        .map((item) => ({
          userId,
          problemSlug: item.slug,
          leetCodeId: item.id,
          submittedAt: new Date(unixToIso(item.timestamp)),
          source: "PUBLIC_RECENT" as const,
          isAccepted: true,
        }))
    );

    await prisma.submission.createMany({
      data: recentSubmissionRows,
    });

    await prisma.$transaction(
      recentAccepted
        .filter((item) => recentSlugs.has(item.slug))
        .map((item) =>
          prisma.userProblem.upsert({
            where: {
              userId_problemSlug: {
                userId,
                problemSlug: item.slug,
              },
            },
            create: {
              userId,
              problemSlug: item.slug,
              firstSolvedAt: new Date(unixToIso(item.timestamp)),
              lastSolvedAt: new Date(unixToIso(item.timestamp)),
              source: "PUBLIC_RECENT",
              confidence: exactSync ? "EXACT" : "PARTIAL",
            },
            update: {
              lastSolvedAt: new Date(unixToIso(item.timestamp)),
              source: exactSync ? "PRIVATE_SOLVED" : "PUBLIC_RECENT",
              confidence: exactSync ? "EXACT" : "PARTIAL",
            },
          })
        )
    );
  }

  if (exactSync) {
    const dedupedSolvedQuestions = dedupeSolvedQuestions(solvedQuestions);
    const solvedBySlug = new Map(
      dedupedSolvedQuestions.map((item) => [item.slug, item] as const)
    );

    const supplementalRecentProblems = await prisma.problem.findMany({
      where: {
        slug: {
          in: recentAccepted
            .map((item) => item.slug)
            .filter((slug) => !solvedBySlug.has(slug)),
        },
      },
      select: {
        slug: true,
        title: true,
        difficulty: true,
        frontendId: true,
        topicNames: true,
      },
    });

    for (const problem of supplementalRecentProblems) {
      const recent = recentAccepted.find((item) => item.slug === problem.slug);

      if (!recent) {
        continue;
      }

      solvedBySlug.set(problem.slug, {
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
        frontendId: problem.frontendId,
        topics: JSON.parse(problem.topicNames || "[]") as string[],
        lastSolvedAt: unixToIso(recent.timestamp),
      });
    }

    const mergedSolvedQuestions = Array.from(solvedBySlug.values());

    const exactProblems = await prisma.problem.findMany({
      where: { slug: { in: mergedSolvedQuestions.map((item) => item.slug) } },
      select: { slug: true },
    });

    const exactSlugs = new Set(exactProblems.map((item) => item.slug));

    await prisma.userProblem.deleteMany({
      where: { userId },
    });

    await prisma.submission.deleteMany({
      where: { userId },
    });

    await prisma.userProblem.createMany({
      data: mergedSolvedQuestions
        .filter((item) => exactSlugs.has(item.slug))
        .map((item) => ({
          userId,
          problemSlug: item.slug,
          source: "PRIVATE_SOLVED",
          confidence: "EXACT",
          firstSolvedAt: item.lastSolvedAt ? new Date(item.lastSolvedAt) : null,
          lastSolvedAt: item.lastSolvedAt ? new Date(item.lastSolvedAt) : null,
        })),
    });

    const exactSubmissionRows = dedupeSubmissionRows(
      mergedSolvedQuestions
        .filter((item) => exactSlugs.has(item.slug) && item.lastSolvedAt)
        .map((item) => ({
          userId,
          problemSlug: item.slug,
          submittedAt: new Date(item.lastSolvedAt as string),
          source: "PRIVATE_SOLVED" as const,
          isAccepted: true,
        }))
    );

    await prisma.submission.createMany({
      data: exactSubmissionRows,
    });

    await updateDerivedUserMetrics(userId);
  }

  const refreshedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      lastSyncAt: true,
      publicMode: true,
    },
  });

  const result = {
    ok: true,
    message: exactSync
      ? "Synced your exact solved-set data from LeetCode."
      : exactSyncError
        ? `Synced public profile data. Exact mode unavailable: ${exactSyncError}`
        : "Synced public profile data. Add session cookies in Settings to unlock exact rating coverage.",
    syncMode: refreshedUser?.publicMode ? "public" : "exact",
    lastSyncAt: refreshedUser?.lastSyncAt?.toISOString(),
  };

  console.log("[sync] completed", result);

  return result;
}
