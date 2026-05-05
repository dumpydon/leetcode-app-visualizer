"use client";

import { ReactNode, useEffect, useState } from "react";

export default function ClientOnly({ children }: { children: ReactNode }) {
  const isDev = process.env.NODE_ENV !== "production";

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isDev) {
      setMounted(true);
    }
  }, [isDev]);

  if (isDev && !mounted) {
    return null;
  }

  return <>{children}</>;
}
