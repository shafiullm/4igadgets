/* GET /api/products/[slug] — single product detail. */
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { serializeProduct } from "@/lib/serialize";
import { handle, json, notFound } from "@/lib/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  return handle(async () => {
    const { slug } = await params;
    const db = await getDb();
    const product = await db.select().from(products).where(eq(products.slug, slug)).get();
    if (!product) return notFound("Product not found");
    const cat = await db
      .select()
      .from(categories)
      .where(eq(categories.id, product.categoryId))
      .get();
    return json({ product: serializeProduct(product, cat?.slug ?? "") });
  });
}
