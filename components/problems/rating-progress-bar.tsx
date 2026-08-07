"use client";

export function RatingProgressBar({ value }: { value: number }) {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div
      className="h-3 overflow-hidden rounded-full bg-muted/80"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percentage)}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
