import { copyFileSync } from "node:fs";
import { join } from "node:path";

const provider = process.env.DATABASE_PROVIDER === "postgresql" ? "postgresql" : "sqlite";
const source = join(process.cwd(), "prisma", `schema.${provider}.prisma`);
const destination = join(process.cwd(), "prisma", "schema.prisma");

copyFileSync(source, destination);
