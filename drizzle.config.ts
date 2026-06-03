import type { Config } from "drizzle-kit";

// drizzle-kit is used only to GENERATE SQL migrations from the schema.
// Migrations are APPLIED to D1 via `wrangler d1 migrations apply` (see package.json).
export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  driver: "d1-http",
} satisfies Config;
