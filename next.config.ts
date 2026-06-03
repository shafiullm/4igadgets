import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Product images are admin-entered URLs; allow any https host (no paid storage yet).
  // Later, Cloudflare R2 + Images could replace this with a fixed loader/domain.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;

// Enables Cloudflare bindings (D1, secrets, etc.) during `next dev`.
// Required by the @opennextjs/cloudflare adapter for local development.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
