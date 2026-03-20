import { NextRequest, NextResponse } from "next/server";

import { getProblemExplorer, getRandomPracticeProblem } from "@/lib/services/analytics-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get("random") === "1") {
      const item = await getRandomPracticeProblem({
        difficulty: searchParams.get("difficulty"),
        minRating: searchParams.get("minRating")
          ? Number(searchParams.get("minRating"))
          : null,
        maxRating: searchParams.get("maxRating")
          ? Number(searchParams.get("maxRating"))
          : null,
      });

      return NextResponse.json({ item });
    }

    const data = await getProblemExplorer({
      band: searchParams.get("band"),
      difficulty: searchParams.get("difficulty"),
      solved: searchParams.get("solved") as "solved" | "remaining" | null,
      search: searchParams.get("search"),
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load problems.",
      },
      { status: 500 }
    );
  }
}
