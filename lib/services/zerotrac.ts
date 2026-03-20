import { env } from "@/lib/env";

export async function fetchZerotracRatings() {
  const response = await fetch(env.zerotracDataUrl, {
    next: { revalidate: 60 * 60 * 12 },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`Zerotrac request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as Array<{
    Rating: number;
    Title: string;
    TitleSlug?: string;
  }>;

  return payload.reduce(
    (map, problem) => {
      if (problem.TitleSlug) {
        map.set(problem.TitleSlug, Math.round(problem.Rating));
      }

      return map;
    },
    new Map<string, number>()
  );
}
