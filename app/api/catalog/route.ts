/* GET /api/catalog - all categories + products in UI shape. */
import { getDb } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { serializeCategory, serializeProduct } from "@/lib/serialize";
import { getHero, getBanner, getNavLinks } from "@/lib/settings";
import { ratingMap } from "@/lib/reviews";
import { pickFeaturedIds, pickDealIds } from "@/lib/home-picks";
import { handle, json } from "@/lib/api";

export async function GET() {
  return handle(async () => {
    const db = await getDb();
    const cats = await db.select().from(categories).all();
    const prods = await db.select().from(products).all();
    const ratings = await ratingMap(db);
    const hero = await getHero(db);
    const banner = await getBanner(db);
    const navLinks = await getNavLinks(db);
    // Drop slugs whose category has since been deleted; empty = automatic.
    const liveSlugs = new Set(cats.map((c) => c.slug));
    const navCats = navLinks.slugs.filter((s) => liveSlugs.has(s));

    const slugById = new Map(cats.map((c) => [c.id, c.slug]));
    const countBySlug = new Map<string, number>();
    for (const p of prods) {
      const slug = slugById.get(p.categoryId);
      if (slug) countBySlug.set(slug, (countBySlug.get(slug) ?? 0) + 1);
    }

    return json({
      categories: cats.map((c) => serializeCategory(c, countBySlug.get(c.slug) ?? 0)),
      products: prods.map((p) => {
        const r = ratings.get(p.id);
        return serializeProduct(p, slugById.get(p.categoryId) ?? "", r?.avg ?? 0, r?.count ?? 0);
      }),
      hero,
      banner,
      navCats,
      featuredIds: pickFeaturedIds(prods, ratings),
      dealIds: pickDealIds(prods),
    });
  });
}
