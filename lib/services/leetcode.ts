import { env } from "@/lib/env";

const REQUEST_TIMEOUT_MS = 20_000;

type GraphqlEnvelope<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type AuthConfig = {
  session?: string | null;
  csrfToken?: string | null;
};

function extractCookieValue(input: string | null | undefined, cookieName: string) {
  if (!input) {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const withoutCookiePrefix = trimmed.replace(/^cookie:\s*/i, "");
  const cookieParts = withoutCookiePrefix.split(";").map((part) => part.trim());

  for (const part of cookieParts) {
    const [name, ...rest] = part.split("=");
    if (name?.trim() === cookieName && rest.length) {
      return rest.join("=").trim();
    }
  }

  const directPrefix = `${cookieName}=`;
  if (withoutCookiePrefix.startsWith(directPrefix)) {
    return withoutCookiePrefix.slice(directPrefix.length).trim();
  }

  return trimmed;
}

function normalizeAuth(auth?: AuthConfig | null) {
  return {
    session: extractCookieValue(auth?.session, "LEETCODE_SESSION"),
    csrfToken: extractCookieValue(auth?.csrfToken, "csrftoken"),
  };
}

export type LeetCodeQuestion = {
  frontendId: string | null;
  title: string;
  slug: string;
  difficulty: string;
  topics: string[];
  isPaidOnly: boolean;
};

export type QuestionCatalogSummary = {
  total: number;
  easy: number;
  medium: number;
  hard: number;
};

export type PublicProfile = {
  username: string;
  totalSolved: number;
  totalEasy: number;
  totalMedium: number;
  totalHard: number;
  contestRating: number | null;
  contestGlobalRanking: number | null;
  streakCurrent: number;
  submissionCalendar: Record<string, number>;
  topicCounts: Array<{ topic: string; solved: number }>;
};

export type RecentAcceptedSubmission = {
  id: string;
  title: string;
  slug: string;
  timestamp: string;
};

export type ContestHistoryPoint = {
  contestTitle: string;
  contestStartTime: string;
  rating: number;
  ranking: number | null;
  problemsSolved: number | null;
  totalProblems: number | null;
  finishTimeSeconds: number | null;
};

export type SolvedQuestion = {
  title: string;
  slug: string;
  difficulty: string;
  topics: string[];
  frontendId: string | null;
  lastSolvedAt: string | null;
};

async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  auth?: AuthConfig
) {
  const normalizedAuth = normalizeAuth(auth);
  const headers: HeadersInit = {
    "content-type": "application/json",
    origin: "https://leetcode.com",
    referer: "https://leetcode.com/",
  };

  if (normalizedAuth.session) {
    headers.cookie = `LEETCODE_SESSION=${normalizedAuth.session}; csrftoken=${normalizedAuth.csrfToken ?? ""};`;
  }

  if (normalizedAuth.csrfToken) {
    headers["x-csrftoken"] = normalizedAuth.csrfToken;
  }

  const response = await fetch(env.leetcodeGraphqlUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`LeetCode request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as GraphqlEnvelope<T>;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((item) => item.message).join(", "));
  }

  if (!payload.data) {
    throw new Error("LeetCode returned an empty response.");
  }

  return payload.data;
}

export async function validateAuthenticatedSession(auth: AuthConfig) {
  const normalizedAuth = normalizeAuth(auth);

  if (!normalizedAuth.session) {
    return {
      ok: false,
      reason: "Missing LEETCODE_SESSION cookie.",
    };
  }

  try {
    const payload = await graphqlFetch<{
      userStatus: {
        isSignedIn: boolean;
        username: string;
      } | null;
    }>(
      `
        query AuthStatus {
          userStatus {
            isSignedIn
            username
          }
        }
      `,
      undefined,
      normalizedAuth
    );

    if (!payload.userStatus?.isSignedIn) {
      return {
        ok: false,
        reason:
          "LeetCode rejected the saved cookies. Re-copy LEETCODE_SESSION and csrftoken from https://leetcode.com.",
      };
    }

    return {
      ok: true,
      username: payload.userStatus.username,
      auth: normalizedAuth,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown authentication error.";
    return {
      ok: false,
      reason: `LeetCode auth check failed: ${message}`,
    };
  }
}

export async function fetchQuestionCatalog() {
  const response = await fetch("https://leetcode.com/api/problems/all/", {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`LeetCode catalog request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as {
    stat_status_pairs: Array<{
      stat: {
        frontend_question_id: number | string;
        question__title: string;
        question__title_slug: string;
      };
      difficulty: { level: number };
      paid_only: boolean;
    }>;
  };

  const difficultyMap: Record<number, string> = {
    1: "Easy",
    2: "Medium",
    3: "Hard",
  };

  return payload.stat_status_pairs.map((question) => ({
    frontendId: String(question.stat.frontend_question_id),
    title: question.stat.question__title,
    slug: question.stat.question__title_slug,
    difficulty: difficultyMap[question.difficulty.level] ?? "Medium",
    topics: [],
    isPaidOnly: question.paid_only,
  }));
}

export async function fetchQuestionCatalogSummary(): Promise<QuestionCatalogSummary> {
  const response = await fetch("https://leetcode.com/api/problems/all/", {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`LeetCode catalog request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as {
    num_total: number;
    stat_status_pairs: Array<{
      difficulty: { level: number };
    }>;
  };

  const counts = payload.stat_status_pairs.reduce(
    (accumulator, item) => {
      if (item.difficulty.level === 1) {
        accumulator.easy += 1;
      }

      if (item.difficulty.level === 2) {
        accumulator.medium += 1;
      }

      if (item.difficulty.level === 3) {
        accumulator.hard += 1;
      }

      return accumulator;
    },
    { easy: 0, medium: 0, hard: 0 }
  );

  return {
    total: payload.num_total,
    easy: counts.easy,
    medium: counts.medium,
    hard: counts.hard,
  };
}

export async function fetchPublicProfile(username: string): Promise<PublicProfile> {
  const query = `
    query PublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submissionCalendar
        tagProblemCounts {
          advanced { tagName problemsSolved }
          intermediate { tagName problemsSolved }
          fundamental { tagName problemsSolved }
        }
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
      streakCounter(username: $username) {
        streakCount
      }
      userContestRanking(username: $username) {
        rating
        globalRanking
      }
    }
  `;

  const payload = await graphqlFetch<{
    matchedUser: {
      username: string;
      submissionCalendar: string;
      tagProblemCounts: {
        advanced: Array<{ tagName: string; problemsSolved: number }>;
        intermediate: Array<{ tagName: string; problemsSolved: number }>;
        fundamental: Array<{ tagName: string; problemsSolved: number }>;
      };
      submitStatsGlobal: {
        acSubmissionNum: Array<{ difficulty: string; count: number }>;
      };
    } | null;
    streakCounter: { streakCount: number } | null;
    userContestRanking: { rating: number; globalRanking: number } | null;
  }>(query, { username });

  if (!payload.matchedUser) {
    throw new Error(`LeetCode user "${username}" was not found.`);
  }

  const counts = payload.matchedUser.submitStatsGlobal.acSubmissionNum.reduce(
    (accumulator, item) => {
      accumulator[item.difficulty] = item.count;
      return accumulator;
    },
    {} as Record<string, number>
  );

  const topicCounts = [
    ...payload.matchedUser.tagProblemCounts.fundamental,
    ...payload.matchedUser.tagProblemCounts.intermediate,
    ...payload.matchedUser.tagProblemCounts.advanced,
  ]
    .map((item) => ({ topic: item.tagName, solved: item.problemsSolved }))
    .sort((left, right) => right.solved - left.solved);

  return {
    username: payload.matchedUser.username,
    totalSolved: counts.All ?? 0,
    totalEasy: counts.Easy ?? 0,
    totalMedium: counts.Medium ?? 0,
    totalHard: counts.Hard ?? 0,
    contestRating: payload.userContestRanking?.rating ?? null,
    contestGlobalRanking: payload.userContestRanking?.globalRanking ?? null,
    streakCurrent: payload.streakCounter?.streakCount ?? 0,
    submissionCalendar: JSON.parse(payload.matchedUser.submissionCalendar || "{}") as Record<
      string,
      number
    >,
    topicCounts,
  };
}

export async function fetchRecentAccepted(username: string, limit = 20) {
  const query = `
    query RecentAccepted($username: String!, $limit: Int) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `;

  const payload = await graphqlFetch<{
    recentAcSubmissionList: Array<{
      id: string;
      title: string;
      titleSlug: string;
      timestamp: string;
    }>;
  }>(query, { username, limit });

  return payload.recentAcSubmissionList.map((submission) => ({
    id: submission.id,
    title: submission.title,
    slug: submission.titleSlug,
    timestamp: submission.timestamp,
  })) satisfies RecentAcceptedSubmission[];
}

export async function fetchContestHistory(username: string) {
  const query = `
    query ContestHistory($username: String!) {
      userContestRankingHistory(username: $username) {
        attended
        rating
        ranking
        problemsSolved
        totalProblems
        finishTimeInSeconds
        contest {
          title
          startTime
        }
      }
    }
  `;

  const payload = await graphqlFetch<{
    userContestRankingHistory: Array<{
      attended: boolean;
      rating: number;
      ranking: number | null;
      problemsSolved: number | null;
      totalProblems: number | null;
      finishTimeInSeconds: number | null;
      contest: {
        title: string;
        startTime: number;
      };
    }>;
  }>(query, { username });

  return payload.userContestRankingHistory
    .filter((item) => item.attended)
    .map((item) => ({
      contestTitle: item.contest.title,
      contestStartTime: new Date(item.contest.startTime * 1000).toISOString(),
      rating: item.rating,
      ranking: item.ranking,
      problemsSolved: item.problemsSolved,
      totalProblems: item.totalProblems,
      finishTimeSeconds: item.finishTimeInSeconds,
    })) satisfies ContestHistoryPoint[];
}

export async function fetchSolvedQuestions(auth: AuthConfig) {
  const validation = await validateAuthenticatedSession(auth);

  if (!validation.ok) {
    throw new Error(validation.reason);
  }

  const normalizedAuth = validation.auth;

  if (!normalizedAuth?.session) {
    return [];
  }

  const query = `
    query SolvedQuestions($pageNo: Int, $numPerPage: Int, $filters: ProgressListFilterInput) {
      solvedQuestionsInfo(pageNo: $pageNo, numPerPage: $numPerPage, filters: $filters) {
        currentPage
        pageNum
        totalNum
        data {
          lastAcSession {
            time
          }
          question {
            title
            titleSlug
            difficulty
            questionFrontendId
            topicTags {
              name
            }
          }
        }
      }
    }
  `;

  const solved: SolvedQuestion[] = [];
  let currentPage = 1;
  let totalPages = 1;
  const pageSize = 100;

  while (currentPage <= totalPages) {
    const payload = await graphqlFetch<{
      solvedQuestionsInfo: {
        currentPage: number;
        pageNum: number;
        totalNum: number;
        data: Array<{
          lastAcSession: { time: string | null } | null;
          question: {
            title: string;
            titleSlug: string;
            difficulty: string;
            questionFrontendId: string | null;
            topicTags: Array<{ name: string }>;
          };
        }>;
      };
    }>(query, { pageNo: currentPage, numPerPage: pageSize, filters: {} }, normalizedAuth);

    totalPages = payload.solvedQuestionsInfo.pageNum;
    solved.push(
      ...payload.solvedQuestionsInfo.data.map((item) => ({
        title: item.question.title,
        slug: item.question.titleSlug,
        difficulty: item.question.difficulty,
        topics: item.question.topicTags.map((topic) => topic.name),
        frontendId: item.question.questionFrontendId,
        lastSolvedAt: item.lastAcSession?.time ?? null,
      }))
    );

    currentPage += 1;
  }

  return solved;
}
