import { PrismaClient } from "@prisma/client";

// Connection pool: styrs via DATABASE_URL query-param, t.ex.:
//   ?connection_limit=5   (Railway direct)
//   ?pgbouncer=true&connection_limit=1  (PgBouncer/pooler)
// Default Prisma pool = 10 connections — räcker för tidig trafik.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "production"
    ? [{ level: "error", emit: "stdout" }]
    : [{ level: "warn", emit: "stdout" }, { level: "error", emit: "stdout" }],
});
