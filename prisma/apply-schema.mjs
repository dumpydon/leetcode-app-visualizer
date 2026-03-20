import { closeSync, existsSync, mkdirSync, openSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const provider = process.env.DATABASE_PROVIDER === "postgresql" ? "postgresql" : "sqlite";
const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const schemaPath = join(process.cwd(), "prisma", "schema.prisma");
const sqlPath = join(process.cwd(), "prisma", ".generated.sql");

function getCliDatabaseUrl(url) {
  if (provider !== "sqlite") {
    return url;
  }

  return `file:${resolveSqlitePath(url)}`;
}

function resolveSqlitePath(url) {
  const filePath = url.replace(/^file:/, "");
  return resolve(process.cwd(), filePath);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function sqliteFileExists(url) {
  if (!url.startsWith("file:")) {
    return false;
  }

  const resolved = resolveSqlitePath(url);
  mkdirSync(dirname(resolved), { recursive: true });
  return existsSync(resolved);
}

const cliDatabaseUrl = getCliDatabaseUrl(databaseUrl);
const sqliteDatabaseExists = provider === "sqlite" ? sqliteFileExists(databaseUrl) : true;

if (provider === "sqlite" && !sqliteDatabaseExists) {
  const resolved = resolveSqlitePath(databaseUrl);
  mkdirSync(dirname(resolved), { recursive: true });
  closeSync(openSync(resolved, "a"));
}

const diffArgs =
  provider === "sqlite" && !sqliteDatabaseExists
    ? [
        "prisma",
        "migrate",
        "diff",
        "--from-empty",
        "--to-schema-datamodel",
        schemaPath,
        "--script",
        "--output",
        sqlPath,
      ]
    : [
        "prisma",
        "migrate",
        "diff",
        "--from-url",
        cliDatabaseUrl,
        "--to-schema-datamodel",
        schemaPath,
        "--script",
        "--output",
        sqlPath,
      ];

run("npx", diffArgs);

const sql = readFileSync(sqlPath, "utf8").trim();

if (!sql || sql === "-- This is an empty migration.") {
  process.exit(0);
}

run("npx", [
  "prisma",
  "db",
  "execute",
  "--schema",
  schemaPath,
  "--url",
  cliDatabaseUrl,
  "--file",
  sqlPath,
]);
