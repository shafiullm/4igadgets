/* ============================================================
   GET  /api/favourites - productIds the current user has liked
   POST /api/favourites - toggle a like   Body: { productId }
   Login required (guests are prompted to log in on the client).
   ============================================================ */
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { favourites } from "@/lib/db/schema";
import { newId } from "@/lib/db/id";
import { getSessionUser } from "@/lib/auth/session";
import { handle, json, badRequest, unauthorized } from "@/lib/api";

async function listIds(db: Awaited<ReturnType<typeof getDb>>, userId: string) {
  const rows = await db
    .select({ productId: favourites.productId })
    .from(favourites)
    .where(eq(favourites.userId, userId))
    .all();
  return rows.map((r) => r.productId);
}

export async function GET() {
  return handle(async () => {
    const user = await getSessionUser();
    if (!user) return json({ ids: [] });
    const db = await getDb();
    return json({ ids: await listIds(db, user.id) });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized("Please log in to save favourites");
    const { productId } = (await req.json()) as { productId?: string };
    if (!productId) return badRequest("productId is required");

    const db = await getDb();
    const existing = await db
      .select()
      .from(favourites)
      .where(and(eq(favourites.userId, user.id), eq(favourites.productId, productId)))
      .get();

    if (existing) {
      await db.delete(favourites).where(eq(favourites.id, existing.id));
    } else {
      await db
        .insert(favourites)
        .values({ id: newId("fav"), userId: user.id, productId })
        .onConflictDoNothing();
    }

    const ids = await listIds(db, user.id);
    return json({ favourited: !existing, ids });
  });
}
