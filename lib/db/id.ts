/**
 * Small, dependency-free unique id generator (Workers-compatible).
 * Uses Web Crypto, which is available on the Cloudflare Workers runtime.
 */
export function newId(prefix = ""): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return prefix ? `${prefix}_${hex}` : hex;
}
