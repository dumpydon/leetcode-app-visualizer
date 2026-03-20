"use client";

import { useEffect, useState } from "react";

export function ChartShell({
  children,
  heightClassName = "h-[280px]",
}: {
  children: React.ReactNode;
  heightClassName?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`${heightClassName} animate-pulse rounded-2xl border border-dashed bg-muted/30`}
      />
    );
  }

  return <>{children}</>;
}
