export const env = {
  databaseProvider: process.env.DATABASE_PROVIDER ?? "sqlite",
  databaseUrl: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "LeetCode Visualizer",
  zerotracDataUrl:
    process.env.ZEROTRAC_DATA_URL ??
    "https://zerotrac.github.io/leetcode_problem_rating/data.json",
  leetcodeGraphqlUrl: process.env.LEETCODE_GRAPHQL_URL ?? "https://leetcode.com/graphql",
  leetcodeSession: process.env.LEETCODE_SESSION,
  leetcodeCsrfToken: process.env.LEETCODE_CSRF_TOKEN,
};
