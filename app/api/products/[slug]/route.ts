/* ============================================================
   GET  /api/products/[slug] — product detail + reviews + my review
   POST /api/products/[slug] — submit/update my review (login required)
                               Body: { rating: 1..5, comment?: string }
   ============================================================ */
import { eq, and, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { categories, products, reviews, orders, orderItems } from "@/lib/db/schema";
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

/** True if the user has a non-cancelled order containing this product. */
async function hasPurchased(
  db: Awaited<ReturnType<typeof getDb>>,
  userId: string,
  productId: string,
): Promise<boolean> {
  const row = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.userId, userId),
        eq(orderItems.productId, productId),
        ne(orders.orderStatus, "CANCELLED"),
      ),
    )
    .get();
  return !!row;
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
    let canReview = false;
    if (user) {
      const row = await db
        .select()
        .from(reviews)
        .where(and(eq(reviews.productId, product.id), eq(reviews.userId, user.id)))
        .get();
      if (row) myReview = { rating: row.rating, comment: row.comment };
      canReview = await hasPurchased(db, user.id, product.id);
    }

    return json({
      product: serializeProduct(product, catSlug, agg?.avg ?? 0, agg?.count ?? 0),
      reviews: list,
      myReview,
      canReview,
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

    // You may only review a product you've actually purchased.
    if (!(await hasPurchased(db, user.id, product.id))) {
      return json(
        { error: "You can only review products you've purchased" },
        { status: 403 },
      );
    }

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
