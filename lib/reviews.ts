/* ============================================================
   Review aggregates + listing helpers.
   ============================================================ */
import { sql, eq, desc } from "drizzle-orm";
import { reviews, users } from "./db/schema";
import type { getDb } from "./db";

type Db = Awaited<ReturnType<typeof getDb>>;

export type RatingAgg = { avg: number; count: number };

/** Map of productId -> { avg, count } across all reviews. */
export async function ratingMap(db: Db): Promise<Map<string, RatingAgg>> {
  const rows = await db
    .select({
      productId: reviews.productId,
      avg: sql<number>`avg(${reviews.rating})`,
      count: sql<number>`count(*)`,
    })
    .from(reviews)
    .groupBy(reviews.productId)
    .all();
  const m = new Map<string, RatingAgg>();
  for (const r of rows) m.set(r.productId, { avg: Number(r.avg) || 0, count: Number(r.count) || 0 });
  return m;
}

export type UiReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: number;
  userName: string;
};

/** All reviews for one product, newest first, with the reviewer's name. */
export async function productReviews(db: Db, productId: string): Promise<UiReview[]> {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      userName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt))
    .all();
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt as unknown as number,
    userName: r.userName,
  }));
}
