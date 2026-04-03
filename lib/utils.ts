import { clsx, type ClassValue } from "clsx";
import { format, fromUnixTime, isSameDay, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

const utcMonthDayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const utcLongDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleToUrl(slug: string) {
  return `https://leetcode.com/problems/${slug}/`;
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function percentile(values: number[], p: number) {
  if (!values.length) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const clampedPercentile = Math.min(100, Math.max(0, p));
  const index = Math.floor((clampedPercentile / 100) * (sorted.length - 1));
  return sorted[index];
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function percentage(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export function unixToIso(value: number | string) {
  return fromUnixTime(Number(value)).toISOString();
}

export function toUtcDateKey(value: string | number | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

export function unixSecondsToUtcDateKey(value: string | number) {
  return new Date(Number(value) * 1000).toISOString().slice(0, 10);
}

export function utcDateKeyToDayIndex(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function utcDayIndexToDateKey(dayIndex: number) {
  return new Date(dayIndex * 86_400_000).toISOString().slice(0, 10);
}

export function startOfUtcWeekDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const weekday = utcDate.getUTCDay();
  return utcDayIndexToDateKey(utcDateKeyToDayIndex(dateKey) - weekday);
}

export function formatUtcDateKey(dateKey: string, mode: "short" | "long" = "long") {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return mode === "short"
    ? utcMonthDayFormatter.format(utcDate)
    : utcLongDateFormatter.format(utcDate);
}

export function formatDate(value: string | Date, dateFormat = "MMM d, yyyy") {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, dateFormat);
}

export function sameCalendarDay(left: string | Date, right: string | Date) {
  const a = typeof left === "string" ? parseISO(left) : left;
  const b = typeof right === "string" ? parseISO(right) : right;
  return isSameDay(a, b);
}

export function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}
