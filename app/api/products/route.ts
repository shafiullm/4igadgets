/* GET /api/products?category=<slug> — products, optionally filtered by category. */
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { serializeProduct } from "@/lib/serialize";
import { handle, json } from "@/lib/api";

export async function GET(req: Request) {
  return handle(async () => {
    const db = await getDb();
    const slug = new URL(req.url).searchParams.get("category");
    const cats = await db.select().from(categories).all();
    const slugById = new Map(cats.map((c) => [c.id, c.slug]));

    let rows;
    if (slug) {
      const cat = cats.find((c) => c.slug === slug);
      if (!cat) return json({ products: [] });
      rows = await db.select().from(products).where(eq(products.categoryId, cat.id)).all();
    } else {
      rows = await db.select().from(products).all();
    }

    return json({
      products: rows.map((p) => serializeProduct(p, slugById.get(p.categoryId) ?? "")),
    });
  });
}
