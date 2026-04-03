"use client";

import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function EntrantHubRatingProgress({ username }: { username: string }) {
  const entrantHubUrl = `https://entranthub.com/contests/leetcode/users/US/${encodeURIComponent(
    username
  )}`;

  function openEntrantHubProfile() {
    window.open(entrantHubUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>EntrantHub Rating Progress</CardTitle>
        <CardDescription>Contest rating progression from LeetCode contests.</CardDescription>
      </CardHeader>
      <CardContent>
        <button
          type="button"
          onClick={openEntrantHubProfile}
          className="group relative h-[280px] w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 text-left transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_20px_50px_-24px_rgba(34,211,238,0.4)]"
          aria-label="Open EntrantHub contest rating history"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_45%)]" />

          <svg
            viewBox="0 0 1200 320"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-35"
          >
            <defs>
              <linearGradient id="entranthub-line" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.45" />
              </linearGradient>
            </defs>
            <path
              d="M0 248 C80 232, 140 176, 220 186 C300 196, 340 150, 410 164 C488 178, 560 132, 640 146 C712 160, 760 118, 828 128 C906 140, 960 106, 1040 120 C1114 132, 1160 98, 1200 104"
              fill="none"
              stroke="url(#entranthub-line)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M0 280 C110 270, 200 230, 300 238 C392 246, 468 216, 560 224 C650 232, 730 198, 820 206 C902 214, 988 182, 1080 190 C1142 196, 1180 176, 1200 180"
              fill="none"
              stroke="#475569"
              strokeOpacity="0.35"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          <div className="relative flex h-full items-center justify-center px-6 text-center">
            <div>
              <div className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                View Contest Rating History on EntrantHub
              </div>
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-cyan-100/85">
                Opens your contest profile
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/55 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="rounded-xl border border-cyan-300/40 bg-slate-900/80 px-4 py-2 text-sm font-medium text-cyan-100">
              Click to open EntrantHub profile
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  );
}
