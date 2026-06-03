/* ============================================================
   GET  /api/products/[slug] — product detail + reviews + my review
   POST /api/products/[slug] — submit/update my review (login required)
                               Body: { rating: 1..5, comment?: string }
   ============================================================ */
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { categories, products, reviews } from "@/lib/db/schema";
import { newId } from "@/lib/db/id";
import { getSessionUser } from "@/lib/auth/session";
import { serializeProduct } from "@/lib/serialize";
import { ratingMap, productReviews } from "@/lib/reviews";
import { handle, json, notFound, badRequest, unauthorized } from "@/lib/api";

async function loadProduct(slug: string) {
  const db = await getDb();
  const product = await db.select().from(products).where(eq(products.slug, slug)).get();
  if (!product) return null;
  const cat = await db.select().from(categories).where(eq(categories.id, product.categoryId)).get();
  return { db, product, catSlug: cat?.slug ?? "" };
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const { slug } = await params;
    const loaded = await loadProduct(slug);
    if (!loaded) return notFound("Product not found");
    const { db, product, catSlug } = loaded;

    const ratings = await ratingMap(db);
    const agg = ratings.get(product.id);
    const list = await productReviews(db, product.id);

    const user = await getSessionUser();
    let myReview: { rating: number; comment: string | null } | null = null;
    if (user) {
      const row = await db
        .select()
        .from(reviews)
        .where(and(eq(reviews.productId, product.id), eq(reviews.userId, user.id)))
        .get();
      if (row) myReview = { rating: row.rating, comment: row.comment };
    }

    return json({
      product: serializeProduct(product, catSlug, agg?.avg ?? 0, agg?.count ?? 0),
      reviews: list,
      myReview,
    });
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized("Please log in to leave a review");

    const { slug } = await params;
    const loaded = await loadProduct(slug);
    if (!loaded) return notFound("Product not found");
    const { db, product, catSlug } = loaded;

    const body = (await req.json()) as { rating?: number; comment?: string };
    const rating = Math.round(Number(body.rating));
    if (!(rating >= 1 && rating <= 5)) return badRequest("Rating must be between 1 and 5");
    const comment = (body.comment ?? "").trim().slice(0, 1000) || null;

    const existing = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.productId, product.id), eq(reviews.userId, user.id)))
      .get();

    if (existing) {
      await db
        .update(reviews)
        .set({ rating, comment, createdAt: new Date() })
        .where(eq(reviews.id, existing.id));
    } else {
      await db.insert(reviews).values({
        id: newId("rev"),
        userId: user.id,
        productId: product.id,
        rating,
        comment,
      });
    }

    const ratings = await ratingMap(db);
    const agg = ratings.get(product.id);
    const list = await productReviews(db, product.id);
    return json({
      product: serializeProduct(product, catSlug, agg?.avg ?? 0, agg?.count ?? 0),
      reviews: list,
      myReview: { rating, comment },
    });
  });
}
