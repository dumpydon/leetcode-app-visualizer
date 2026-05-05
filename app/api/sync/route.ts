import { NextResponse } from "next/server";

import { syncPrimaryUser } from "@/lib/services/sync-service";

export const dynamic = "force-dynamic";
const SYNC_TIMEOUT_MS = 240_000;

export async function POST() {
  try {
    console.log("[api/sync] request received");
    const result = await Promise.race([
      syncPrimaryUser(),
      new Promise<never>((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                "Sync timed out after 4 minutes. Please retry once the initial catalog refresh completes."
              )
            ),
          SYNC_TIMEOUT_MS
        );
      }),
    ]);
    console.log("[api/sync] request completed", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/sync] request failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Sync failed.",
      },
      { status: 500 }
    );
  }
}
