import { resolve } from "node:path";

import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function getDatasourceUrl() {
  if (env.databaseProvider !== "sqlite") {
    return env.databaseUrl;
  }

  if (!env.databaseUrl.startsWith("file:")) {
    return env.databaseUrl;
  }

  const filePath = env.databaseUrl.replace(/^file:/, "");
  return `file:${resolve(process.cwd(), filePath)}`;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    datasourceUrl: getDatasourceUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
