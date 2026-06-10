/* ============================================================
   Homepage product picks (featured + deals), computed server-side.
   ============================================================ */
import type { Product } from "./db/schema";
import type { RatingAgg } from "./reviews";

/** A deal is a sane discount: 0 < discountedPrice < price. */
const hasDeal = (p: Product) =>
  p.discountedPrice != null && p.discountedPrice > 0 && p.discountedPrice < p.price;

/**
 * "Today's best deals": in-stock products with a valid discount, ranked by
 * percentage off (tie-broken by absolute savings), capped at `limit`.
 */
export function pickDealIds(prods: Product[], limit = 8): string[] {
  return prods
    .filter((p) => hasDeal(p) && p.stock > 0)
    .sort((a, b) => {
      const pctA = (a.price - a.discountedPrice!) / a.price;
      const pctB = (b.price - b.discountedPrice!) / b.price;
      return pctB - pctA || b.price - b.discountedPrice! - (a.price - a.discountedPrice!);
    })
    .slice(0, limit)
    .map((p) => p.id);
}

/**
 * "Featured products", hybrid model: admin-featured products first (newest
 * first; kept even when out of stock - explicit intent wins), then any
 * remaining slots auto-filled from in-stock products by rating, review
 * count, then recency.
 */
export function pickFeaturedIds(
  prods: Product[],
  ratings: Map<string, RatingAgg>,
  limit = 8,
): string[] {
  const manual = prods
    .filter((p) => p.isFeatured)
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, limit);
  const chosen = new Set(manual.map((p) => p.id));
  const fill = prods
    .filter((p) => !chosen.has(p.id) && p.stock > 0)
    .sort((a, b) => {
      const ra = ratings.get(a.id);
      const rb = ratings.get(b.id);
      return (
        (rb?.avg ?? 0) - (ra?.avg ?? 0) ||
        (rb?.count ?? 0) - (ra?.count ?? 0) ||
        Number(b.createdAt) - Number(a.createdAt)
      );
    })
    .slice(0, limit - manual.length);
  return [...manual, ...fill].map((p) => p.id);
}
