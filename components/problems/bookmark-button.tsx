"use client";

import { useMutation } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function BookmarkButton({
  problemSlug,
  label,
  active,
}: {
  problemSlug: string;
  label: "REVIEW_LATER" | "REVISIT";
  active: boolean;
}) {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ problemSlug, label }),
      });

      if (!response.ok) {
        throw new Error("Could not update bookmark.");
      }
    },
    onSuccess: () => router.refresh(),
  });

  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="gap-2"
    >
      <Bookmark className="h-4 w-4" />
      {active ? "Saved" : label === "REVIEW_LATER" ? "Review later" : "Revisit"}
    </Button>
  );
}
