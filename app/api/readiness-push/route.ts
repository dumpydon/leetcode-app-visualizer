import { NextResponse } from "next/server";

import { getReadinessPushRecommendations } from "@/lib/services/analytics-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getReadinessPushRecommendations(true);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load readiness push recommendations.",
      },
      { status: 500 }
    );
  }
}
