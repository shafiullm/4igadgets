/* ============================================================
   PATCH  /api/admin/categories/[id] - edit
   DELETE /api/admin/categories/[id] - delete (cascades products)
   ============================================================ */
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { serializeCategory } from "@/lib/serialize";
import { handle, json, badRequest, notFound } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const body = (await req.json()) as {
      name?: string;
      description?: string;
      imageUrl?: string;
    };
    if (!body.name?.trim()) return badRequest("Category name is required");

    const db = await getDb();
    const existing = await db.select().from(categories).where(eq(categories.id, id)).get();
    if (!existing) return notFound("Category not found");

    await db
      .update(categories)
      .set({
        name: body.name.trim(),
        description: body.description ?? existing.description,
        imageUrl: body.imageUrl ?? existing.imageUrl,
      })
      .where(eq(categories.id, id));
    const updated = await db.select().from(categories).where(eq(categories.id, id)).get();
    return json({ category: serializeCategory(updated!, 0) });
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const db = await getDb();
    await db.delete(categories).where(eq(categories.id, id));
    return json({ ok: true });
  });
}
