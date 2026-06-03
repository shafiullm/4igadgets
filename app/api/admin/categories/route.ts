/* ============================================================
   GET  /api/admin/categories — list with product counts
   POST /api/admin/categories — create
   ============================================================ */
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { newId } from "@/lib/db/id";
import { requireAdmin } from "@/lib/auth/session";
import { serializeCategory } from "@/lib/serialize";
import { handle, json, badRequest } from "@/lib/api";

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export async function GET() {
  return handle(async () => {
    await requireAdmin();
    const db = await getDb();
    const cats = await db.select().from(categories).all();
    const prods = await db.select({ categoryId: products.categoryId }).from(products).all();
    const count = new Map<string, number>();
    for (const p of prods) count.set(p.categoryId, (count.get(p.categoryId) ?? 0) + 1);
    return json({
      categories: cats.map((c) => serializeCategory(c, count.get(c.id) ?? 0)),
    });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const body = (await req.json()) as {
      name?: string;
      description?: string;
      imageUrl?: string;
    };
    const name = body.name?.trim();
    if (!name) return badRequest("Category name is required");

    const db = await getDb();
    const slug = slugify(name);
    const dupe = await db.select().from(categories).where(eq(categories.slug, slug)).get();
    if (dupe) return badRequest("A category with this name already exists");

    const id = newId("cat");
    await db.insert(categories).values({
      id,
      name,
      slug,
      description: body.description ?? null,
      imageUrl: body.imageUrl ?? null,
    });
    const created = await db.select().from(categories).where(eq(categories.id, id)).get();
    return json({ category: serializeCategory(created!, 0) });
  });
}
