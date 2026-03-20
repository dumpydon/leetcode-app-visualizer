import { clsx, type ClassValue } from "clsx";
import { format, fromUnixTime, isSameDay, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

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

export function median(values: number[]) {
  if (!values.length) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }

  return sorted[middle];
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
