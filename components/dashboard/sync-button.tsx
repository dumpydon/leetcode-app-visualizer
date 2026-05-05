"use client";

import { useMutation } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

const SYNC_TIMEOUT_MS = 240_000;

export function SyncButton() {
  const mutation = useMutation({
    mutationFn: async () => {
      console.log("[sync-button] starting sync request");
      const response = await fetch("/api/sync", {
        method: "POST",
        signal: AbortSignal.timeout(SYNC_TIMEOUT_MS),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Sync failed.");
      }

      return payload;
    },
    onSuccess: (payload) => {
      console.log("[sync-button] sync completed", payload);
      window.location.reload();
    },
    onError: (error) => {
      console.error("[sync-button] sync failed", error);
    },
    onSettled: () => {
      console.log("[sync-button] sync settled");
    },
  });

  return (
    <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="gap-2">
      <RefreshCcw className={`h-4 w-4 ${mutation.isPending ? "animate-spin" : ""}`} />
      {mutation.isPending ? "Syncing..." : "Sync with LeetCode"}
    </Button>
  );
}
