import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default OpenNext Cloudflare config. The app does not rely on ISR/SSG caching,
// so no incremental cache is configured. If you later add cached routes, you can
// wire an R2 or KV incremental cache here per the OpenNext docs.
export default defineCloudflareConfig({});
