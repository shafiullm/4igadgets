/* ============================================================
   4iGadgets — D1 + Drizzle connection helper
   ============================================================ */
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

/**
 * Returns a Drizzle client bound to the request's D1 database.
 * Must be called inside a request scope (route handler / server action).
 *
 * `getCloudflareContext()` resolves the worker `env` (bindings + secrets).
 * Locally this is backed by Miniflare's simulated D1; in production it's the
 * real D1 database configured in wrangler.jsonc.
 */
export async function getDb() {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
}

export { schema };
