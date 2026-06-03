// Cloudflare bindings + secrets available on the Workers runtime.
// Regenerate with `npm run cf-typegen` after changing wrangler.jsonc.
interface CloudflareEnv {
  // D1 database binding (wrangler.jsonc -> d1_databases).
  DB: D1Database;
  // Static assets binding (managed by OpenNext).
  ASSETS: Fetcher;
  // Secrets (set via `wrangler secret put` / .dev.vars).
  AUTH_SECRET: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  BKASH_NUMBER: string;
  NAGAD_NUMBER: string;
}
