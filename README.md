# LeetCode Visualizer

A production-ready personal analytics dashboard for LeetCode practice, built with Next.js 14, Tailwind, React Query, Recharts, and a Prisma-backed database layer. It combines LeetCode profile data with the public Zerotrac rating dataset to surface coverage, streaks, topic distribution, recommendations, and a searchable problem explorer.

## Stack

- Next.js 14 App Router
- React + TypeScript
- TailwindCSS + shadcn-style UI primitives
- Recharts
- React Query
- Prisma
- SQLite for local development
- PostgreSQL for production

## What it does

- First-run onboarding with your LeetCode username
- Public sync with just a username
- Optional exact sync using `LEETCODE_SESSION` + `LEETCODE_CSRF_TOKEN`
- Rating band histogram and solved-vs-remaining coverage table
- Searchable problem explorer
- Daily solve tracker and GitHub-style heatmap
- Random practice generator
- Skill rating estimator
- Topic breakdown chart
- Weekly average rating trend
- Streak tracker and hard-problem counter
- Interview readiness meter
- Practice recommendations
- Difficulty mix chart
- Friend leaderboard mode
- Problem bookmarking for `Review later` and `Revisit`

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

That is enough for local development. The repo defaults to SQLite and bootstraps the local schema automatically into [`prisma/dev.db`](/Users/piyushagarwal/LEETCODE/leetcode%20app%20visualizer/prisma/dev.db).

## Environment variables

Use [`.env.example`](/Users/piyushagarwal/LEETCODE/leetcode%20app%20visualizer/.env.example) as the reference.

Required for local defaults:

```env
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./prisma/dev.db
```

Optional for richer analytics:

```env
LEETCODE_SESSION=
LEETCODE_CSRF_TOKEN=
```

If those two values are set, the app can sync your exact solved set instead of relying only on public profile data.

## PostgreSQL on Vercel

Set these environment variables in Vercel:

```env
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://...
LEETCODE_SESSION=
LEETCODE_CSRF_TOKEN=
```

Then deploy normally. The build script will:

1. select the PostgreSQL Prisma schema
2. apply the current schema
3. build the Next.js app

## Data sources

- LeetCode GraphQL: profile summary, streak, recent accepted submissions, contest history, and authenticated solved-question sync
- Zerotrac ratings: [data.json](https://zerotrac.github.io/leetcode_problem_rating/data.json)

## Important note about public mode

LeetCode’s public GraphQL surface does not expose the full solved-problem list for anonymous requests. Because of that:

- username-only sync gives you accurate public summary stats
- exact solved/unsolved explorer coverage needs optional session credentials

The UI surfaces this distinction so you can see whether your current dashboard is in `Public mode` or `Exact solved-set mode`.

## Project structure

```text
app/
components/
lib/
prisma/
```

Key files:

- [app/page.tsx](/Users/piyushagarwal/LEETCODE/leetcode%20app%20visualizer/app/page.tsx)
- [app/api/sync/route.ts](/Users/piyushagarwal/LEETCODE/leetcode%20app%20visualizer/app/api/sync/route.ts)
- [app/api/problems/route.ts](/Users/piyushagarwal/LEETCODE/leetcode%20app%20visualizer/app/api/problems/route.ts)
- [app/api/stats/route.ts](/Users/piyushagarwal/LEETCODE/leetcode%20app%20visualizer/app/api/stats/route.ts)
- [lib/services/sync-service.ts](/Users/piyushagarwal/LEETCODE/leetcode%20app%20visualizer/lib/services/sync-service.ts)
- [lib/services/analytics-service.ts](/Users/piyushagarwal/LEETCODE/leetcode%20app%20visualizer/lib/services/analytics-service.ts)

## Validation

The repo has been verified with:

```bash
npm run lint
npm run build
```
